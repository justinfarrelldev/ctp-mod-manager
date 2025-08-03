import * as fs from 'fs';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// We need to test the internal updateModsTrackingFile function
// Since it's not exported, we'll need to test it through the exported functions that use it
import { applyModsToInstallWithMerge } from './applyModsToInstall';
import { getAppliedMods } from './getAppliedMods';

// Mock dependencies
vi.mock('fs');
vi.mock('./isValidInstall', () => ({
    isValidInstall: vi.fn(),
}));
vi.mock('./applyFileChanges', () => ({
    applyFileChanges: vi.fn(),
}));
vi.mock('./getFileChangesToApplyMod', () => ({
    consolidateLineChangeGroups: vi.fn((x) => x),
    getFileChangesToApplyMod: vi.fn(),
}));
vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('updateModsTrackingFile format consistency', () => {
    const mockInstallDir = '/test/install/dir';
    const mockModsJsonPath = path.join(mockInstallDir, 'mods.json');

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {
            // Mock console.log to avoid test output noise
        });
        vi.spyOn(console, 'error').mockImplementation(() => {
            // Mock console.error to avoid test output noise
        });
    });

    it('should write new format to mods.json when no existing file exists', async () => {
        expect.hasAssertions();

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock that mods.json doesn't exist initially
        vi.mocked(fs.existsSync).mockReturnValue(false);

        // Mock file operations
        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => {
                // Mock writeFileSync to avoid actual file writes
            });

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        await applyModsToInstallWithMerge(mockInstallDir, ['testMod']);

        // Verify that writeFileSync was called with the new format
        expect(writeFileSyncSpy).toHaveBeenCalledWith(
            mockModsJsonPath,
            expect.stringContaining('"appliedMods"'),
            'utf-8'
        );

        // Parse the written content to verify the format
        const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
        const parsedData = JSON.parse(writtenData);

        expect(parsedData).toHaveProperty('appliedMods');
        expect(Array.isArray(parsedData.appliedMods)).toBeTruthy();
        expect(parsedData.appliedMods[0]).toHaveProperty('name', 'testMod');
        expect(parsedData.appliedMods[0]).toHaveProperty('appliedDate');
        expect(typeof parsedData.appliedMods[0].appliedDate).toBe('string');
    });

    it('should maintain new format when updating existing new format file', async () => {
        expect.hasAssertions();

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock existing new format file
        const existingData = {
            appliedMods: [
                {
                    appliedDate: '2023-01-01T00:00:00.000Z',
                    name: 'existingMod',
                },
            ],
        };

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(existingData)
        );

        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => {
                // Mock writeFileSync to avoid actual file writes
            });

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        await applyModsToInstallWithMerge(mockInstallDir, ['newMod']);

        // Verify format is maintained
        const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
        const parsedData = JSON.parse(writtenData);

        expect(parsedData).toHaveProperty('appliedMods');
        expect(parsedData.appliedMods).toHaveLength(2);
        expect(parsedData.appliedMods[0]).toHaveProperty('name', 'existingMod');
        expect(parsedData.appliedMods[1]).toHaveProperty('name', 'newMod');
        expect(parsedData.appliedMods[1]).toHaveProperty('appliedDate');
    });

    it('should convert legacy format to new format when updating', async () => {
        expect.hasAssertions();

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock existing legacy format file
        const legacyData = ['existingMod'];

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(legacyData));

        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => {
                // Mock writeFileSync to avoid actual file writes
            });

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        await applyModsToInstallWithMerge(mockInstallDir, ['newMod']);

        // Verify that the legacy format gets converted to new format
        const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
        const parsedData = JSON.parse(writtenData);

        expect(parsedData).toHaveProperty('appliedMods');
        expect(Array.isArray(parsedData.appliedMods)).toBeTruthy();
        expect(parsedData.appliedMods).toHaveLength(2); // Both existing and new mod should be there

        // Should have both mods
        const modNames = parsedData.appliedMods.map(
            (mod: Readonly<{ name: string }>) => mod.name
        );
        expect(modNames).toContain('existingMod'); // From legacy format
        expect(modNames).toContain('newMod'); // Newly added

        // Check that all mods have the required properties
        expect(
            parsedData.appliedMods.every(
                (mod: Readonly<{ appliedDate: string; name: string }>) =>
                    typeof mod.name === 'string' &&
                    typeof mod.appliedDate === 'string'
            )
        ).toBeTruthy();
    });

    it('should handle corrupted mods.json file gracefully', async () => {
        expect.hasAssertions();

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock corrupted file that causes JSON parse error
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('invalid json{');

        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => {
                // Mock writeFileSync to avoid actual file writes
            });

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        await applyModsToInstallWithMerge(mockInstallDir, ['testMod']);

        // Should still write new format despite corrupted existing file
        const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
        const parsedData = JSON.parse(writtenData);

        expect(parsedData).toHaveProperty('appliedMods');
        expect(parsedData.appliedMods).toHaveLength(1);
        expect(parsedData.appliedMods[0]).toHaveProperty('name', 'testMod');
    });

    it('should not add duplicate mods to the tracking file', async () => {
        expect.hasAssertions();

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock existing file with the mod we're trying to add
        const existingData = {
            appliedMods: [
                { appliedDate: '2023-01-01T00:00:00.000Z', name: 'testMod' },
            ],
        };

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(existingData)
        );

        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => {
                // Mock writeFileSync to avoid actual file writes
            });

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        await applyModsToInstallWithMerge(mockInstallDir, ['testMod']);

        // Should not add duplicate
        const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
        const parsedData = JSON.parse(writtenData);

        expect(parsedData.appliedMods).toHaveLength(1);
        expect(parsedData.appliedMods[0]).toHaveProperty('name', 'testMod');
    });

    describe('round-trip compatibility tests', () => {
        it('should maintain consistency between updateModsTrackingFile write and getAppliedMods read', async () => {
            expect.hasAssertions();

            // Mock that install is valid and mod is a directory
            const { isValidInstall } = await import('./isValidInstall');
            vi.mocked(isValidInstall).mockResolvedValue(true);

            vi.spyOn(fs, 'statSync').mockReturnValue({
                isDirectory: () => true,
            } as fs.Stats);

            // Mock no existing file
            vi.mocked(fs.existsSync).mockReturnValue(false);

            let writtenContent = '';
            vi.spyOn(fs, 'writeFileSync').mockImplementation((_, content) => {
                writtenContent = content as string;
            });

            // Mock getFileChangesToApplyMod to return empty changes
            const { getFileChangesToApplyMod } = await import(
                './getFileChangesToApplyMod'
            );
            vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

            // Apply mods (this will call updateModsTrackingFile internally)
            await applyModsToInstallWithMerge(mockInstallDir, ['mod1', 'mod2']);

            // Now simulate reading the file that was written
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(writtenContent);

            const result = getAppliedMods(mockInstallDir);

            expect(result).toStrictEqual(['mod1', 'mod2']);
        });
    });
});
