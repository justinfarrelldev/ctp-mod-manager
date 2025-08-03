import * as fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the function under test through applyModsToInstall
import { applyModsToInstallWithMerge } from './applyModsToInstall';

// Mock dependencies
vi.mock('fs');

vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

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

describe('updateModsTrackingFile - preserve legacy mods', () => {
    const mockInstallDir = '/test/install/dir';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {
            // Suppress console output during tests
        });
        vi.spyOn(console, 'error').mockImplementation(() => {
            // Suppress console output during tests
        });
    });

    it('should preserve existing mods when converting from legacy format to new format', async () => {
        expect.assertions(3);

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock existing legacy mods.json with existing mods
        const existingLegacyMods = ['oldMod1', 'oldMod2'];
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(existingLegacyMods)
        );

        // Mock file operations
        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => {
                // Mock implementation
            });

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        // Apply a new mod
        await applyModsToInstallWithMerge(mockInstallDir, ['newMod']);

        // Verify that writeFileSync was called
        expect(writeFileSyncSpy).toHaveBeenCalledWith(
            expect.stringContaining('mods.json'),
            expect.any(String),
            'utf-8'
        );

        // Get the written data
        const writtenData = writeFileSyncSpy.mock.calls[0][1] as string;
        const parsedWrittenData = JSON.parse(writtenData);

        // Should preserve existing mods AND add the new mod
        expect(parsedWrittenData.appliedMods).toHaveLength(3);

        const modNames = parsedWrittenData.appliedMods.map(
            (mod: Readonly<{ name: string }>) => mod.name
        );
        expect(modNames).toStrictEqual(
            expect.arrayContaining(['oldMod1', 'oldMod2', 'newMod'])
        );
    });

    it('should preserve existing mods when there are duplicates in legacy format', async () => {
        expect.assertions(3);

        // Mock that install is valid and mod is a directory
        const { isValidInstall } = await import('./isValidInstall');
        vi.mocked(isValidInstall).mockResolvedValue(true);

        vi.spyOn(fs, 'statSync').mockReturnValue({
            isDirectory: () => true,
        } as fs.Stats);

        // Mock existing legacy mods.json with existing mods including one we're about to add
        const existingLegacyMods = ['oldMod1', 'duplicateMod', 'oldMod2'];
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(existingLegacyMods)
        );

        // Mock file operations
        const writeFileSyncSpy = vi
            .spyOn(fs, 'writeFileSync')
            .mockImplementation(() => undefined);

        // Mock getFileChangesToApplyMod to return empty changes
        const { getFileChangesToApplyMod } = await import(
            './getFileChangesToApplyMod'
        );
        vi.mocked(getFileChangesToApplyMod).mockResolvedValue([]);

        // Apply a mod that already exists in legacy format
        await applyModsToInstallWithMerge(mockInstallDir, ['duplicateMod']);

        // Verify that writeFileSync was called
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);

        // Verify the file path
        const callArgs = writeFileSyncSpy.mock.calls[0];
        expect(callArgs[0]).toContain('mods.json');

        // Get the written data
        const writtenData = callArgs[1] as string;
        const parsedWrittenData = JSON.parse(writtenData);

        // Should preserve existing mods but not duplicate
        const modNames = parsedWrittenData.appliedMods.map(
            (mod: Readonly<{ name: string }>) => mod.name
        );
        expect(modNames).toStrictEqual(['oldMod1', 'duplicateMod', 'oldMod2']);
    });
});
