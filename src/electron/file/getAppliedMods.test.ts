import * as fs from 'fs';
import * as path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAppliedMods } from './getAppliedMods';

// Mock fs module
vi.mock('fs');

describe('getAppliedMods', () => {
    const mockInstallDir = '/test/install/dir';
    const mockModsJsonPath = path.join(mockInstallDir, 'mods.json');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return empty array when mods.json does not exist', () => {
        expect.hasAssertions();

        vi.mocked(fs.existsSync).mockReturnValue(false);

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual([]);
        expect(fs.existsSync).toHaveBeenCalledWith(mockModsJsonPath);
    });

    it('should return mod names from array format (legacy format)', () => {
        expect.hasAssertions();

        const mockMods = ['mod1', 'mod2', 'mod3'];
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockMods));

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual(mockMods);
    });

    it('should return mod names from object format with appliedMods array (new format)', () => {
        expect.hasAssertions();

        const mockModsData = {
            appliedMods: [
                { appliedDate: '2023-01-01T00:00:00.000Z', name: 'mod1' },
                { appliedDate: '2023-01-02T00:00:00.000Z', name: 'mod2' },
                { appliedDate: '2023-01-03T00:00:00.000Z', name: 'mod3' },
            ],
        };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(mockModsData)
        );

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual(['mod1', 'mod2', 'mod3']);
    });

    it('should return empty array when object format has no appliedMods property', () => {
        expect.hasAssertions();

        const mockModsData = { someOtherProperty: 'value' };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(mockModsData)
        );

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual([]);
    });

    it('should return empty array when object format has empty appliedMods array', () => {
        expect.hasAssertions();

        const mockModsData: { appliedMods: never[] } = { appliedMods: [] };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(mockModsData)
        );

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual([]);
    });

    it('should handle invalid JSON and return empty array', () => {
        expect.hasAssertions();

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {
                // Mock console.error to avoid test output noise
            });

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error parsing mods.json')
        );
    });

    it('should handle file read error and return empty array', () => {
        expect.hasAssertions();

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockImplementation(() => {
            throw new Error('File read error');
        });

        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {
                // Mock console.error to avoid test output noise
            });

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error reading mods.json')
        );
    });

    it('should handle object format with malformed appliedMods entries', () => {
        expect.hasAssertions();

        const mockModsData = {
            appliedMods: [
                { appliedDate: '2023-01-01T00:00:00.000Z', name: 'mod1' },
                { name: 'mod2' }, // Missing appliedDate - should still work
                { appliedDate: '2023-01-03T00:00:00.000Z' }, // Missing name - should be skipped
                { appliedDate: '2023-01-04T00:00:00.000Z', name: 'mod3' },
            ],
        };
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(mockModsData)
        );

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual(['mod1', 'mod2', 'mod3']);
    });

    it('should handle mixed format gracefully (neither array nor object with appliedMods)', () => {
        expect.hasAssertions();

        const mockInvalidData = 'just a string';
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(mockInvalidData)
        );

        const result = getAppliedMods(mockInstallDir);

        expect(result).toStrictEqual([]);
    });

    describe('format consistency integration tests', () => {
        it('should be compatible with the format written by updateModsTrackingFile from applyModsToInstall', () => {
            expect.hasAssertions();

            // Simulate the format that updateModsTrackingFile would write
            const simulatedWrittenFormat = {
                appliedMods: [
                    { appliedDate: '2023-01-01T00:00:00.000Z', name: 'mod1' },
                    { appliedDate: '2023-01-02T00:00:00.000Z', name: 'mod2' },
                ],
            };

            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify(simulatedWrittenFormat)
            );

            const result = getAppliedMods(mockInstallDir);

            expect(result).toStrictEqual(['mod1', 'mod2']);
        });

        it('should handle when legacy format is read after new format was expected to be written', () => {
            expect.hasAssertions();

            // This could happen if there's a bug in updateModsTrackingFile or external modification
            const legacyFormat = ['mod1', 'mod2', 'mod3'];

            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify(legacyFormat)
            );

            const result = getAppliedMods(mockInstallDir);

            expect(result).toStrictEqual(['mod1', 'mod2', 'mod3']);
        });

        it('should handle transitional state where old format gets updated to new format', () => {
            expect.hasAssertions();

            // First call - legacy format
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify(['oldMod'])
            );

            const resultLegacy = getAppliedMods(mockInstallDir);
            expect(resultLegacy).toStrictEqual(['oldMod']);

            // Second call - new format (as if updateModsTrackingFile was called)
            const newFormat = {
                appliedMods: [
                    { appliedDate: '2023-01-01T00:00:00.000Z', name: 'oldMod' },
                    { appliedDate: '2023-01-02T00:00:00.000Z', name: 'newMod' },
                ],
            };
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify(newFormat)
            );

            const resultNew = getAppliedMods(mockInstallDir);
            expect(resultNew).toStrictEqual(['oldMod', 'newMod']);
        });
    });
});
