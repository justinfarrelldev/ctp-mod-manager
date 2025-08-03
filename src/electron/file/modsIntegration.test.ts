import * as fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAppliedMods } from './getAppliedMods';

vi.mock('fs');

// Integration test to verify mods.json format consistency
describe('mod application and tracking integration', () => {
    const mockInstallDir = '/test/install/dir';
    const mockMods = ['testMod1', 'testMod2'];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should read legacy format and new format consistently', () => {
        expect.hasAssertions();

        // Test legacy format
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockMods));

        const legacyResult = getAppliedMods(mockInstallDir);
        expect(legacyResult).toStrictEqual(mockMods);

        // Test new format by changing the mock return value
        const newFormatData = {
            appliedMods: mockMods.map((mod, index) => ({
                appliedDate: `2023-01-0${index + 1}T00:00:00.000Z`,
                name: mod,
            })),
        };
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(newFormatData)
        );

        const newFormatResult = getAppliedMods(mockInstallDir);
        expect(newFormatResult).toStrictEqual(mockMods);

        // Both formats should return the same result
        expect(legacyResult).toStrictEqual(newFormatResult);
    });

    it('should handle mixed data gracefully', () => {
        expect.hasAssertions();

        // Test case where some mods have metadata and others don't
        const mixedData = {
            appliedMods: [
                { appliedDate: '2023-01-01T00:00:00.000Z', name: 'testMod1' },
                { name: 'testMod2' }, // Missing appliedDate
                { appliedDate: '2023-01-03T00:00:00.000Z' }, // Missing name - should be filtered out
                { appliedDate: '2023-01-04T00:00:00.000Z', name: 'testMod3' },
            ],
        };

        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mixedData));

        const result = getAppliedMods(mockInstallDir);
        expect(result).toStrictEqual(['testMod1', 'testMod2', 'testMod3']);
    });

    it('should preserve mod order from both formats', () => {
        expect.hasAssertions();

        const orderedMods = ['firstMod', 'secondMod', 'thirdMod'];

        // Test legacy format preserves order
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(orderedMods));

        const legacyResult = getAppliedMods(mockInstallDir);
        expect(legacyResult).toStrictEqual(orderedMods);

        // Test new format preserves order by changing mock return value
        const newFormatData = {
            appliedMods: orderedMods.map((mod, index) => ({
                appliedDate: `2023-01-0${index + 1}T00:00:00.000Z`,
                name: mod,
            })),
        };
        vi.mocked(fs.readFileSync).mockReturnValue(
            JSON.stringify(newFormatData)
        );

        const newFormatResult = getAppliedMods(mockInstallDir);
        expect(newFormatResult).toStrictEqual(orderedMods);
    });
});
