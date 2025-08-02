import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import { isValidInstall } from './isValidInstall';

vi.mock('fs');

const mockedFs = vi.mocked(fs);

describe('isValidInstall', () => {
    it('should return true if ctp2_data directory exists', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce(['ctp2_data'] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });
    it('should return true if ctp_data directory exists (CTP1)', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce(['ctp_data'] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });
    it('should return false if directory is empty', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeFalsy();
    });
    it('should handle multiple directories and return true if ctp2_data exists', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp2_data',
            'ctp2_program',
        ] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });
    it('should handle multiple directories and return true if ctp_data exists (CTP1)', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp_data',
            'ctp_program',
        ] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });
    it('should handle multiple directories and return true if ctp2_program exists', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp2_data',
            'ctp2_program',
        ] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });
    it('should handle multiple directories and return true if ctp_program exists (CTP1)', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp_data',
            'ctp_program',
        ] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeTruthy();
    });
    it('should handle multiple directories and return false if ctp2_data and ctp_data do not exist', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp2_program',
            'data',
        ] as never);
        const result = await isValidInstall('/game');
        expect(result).toBeFalsy();
    });
});
