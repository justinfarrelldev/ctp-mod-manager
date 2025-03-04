import fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isValidInstall } from './isValidInstall';

vi.mock('fs');

describe('isValidInstall', () => {
    it('should return true if ctp2_data directory exists', async () => {
        // Mock for this test case
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce(['ctp2_data']); // Return the mock value

        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });

    it('should return false if directory is empty', async () => {
        // Mock for this test case
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]); // Simulate empty directory

        const result = await isValidInstall('/game');
        expect(result).toBeFalsy();
    });

    it('should handle multiple directories and return true if ctp2_data exists', async () => {
        // Mock for this test case
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([
            // @ts-expect-error This is a mock
            'ctp2_data',
            // @ts-expect-error This is a mock
            'ctp2_program',
        ]); // Return the mock value

        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });

    it('should handle multiple directories and return false if ctp2_data does not exist', async () => {
        // Mock for this test case
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([
            // @ts-expect-error This is a mock
            'ctp2_program',
            // @ts-expect-error This is a mock
            'data',
        ]); // Simulate non-existing directory

        const result = await isValidInstall('/game');
        expect(result).toBeFalsy();
    });
});
