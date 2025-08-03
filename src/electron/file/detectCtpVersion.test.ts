import fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import { detectCtpVersion } from './detectCtpVersion';

vi.mock('fs');

const mockedFs = vi.mocked(fs);

describe('detectCtpVersion', () => {
    it('should return "CTP1" when ctp_data directory exists', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp_data',
            'ctp_program',
        ] as never);
        const result = await detectCtpVersion('/ctp1/install');
        expect(result).toBe('CTP1');
    });

    it('should return "CTP2" when ctp2_data directory exists', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp2_data',
            'ctp2_program',
        ] as never);
        const result = await detectCtpVersion('/ctp2/install');
        expect(result).toBe('CTP2');
    });

    it('should return "CTP1" when only ctp_data exists (without ctp_program)', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce(['ctp_data'] as never);
        const result = await detectCtpVersion('/ctp1/install');
        expect(result).toBe('CTP1');
    });

    it('should return "CTP2" when only ctp2_data exists (without ctp2_program)', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce(['ctp2_data'] as never);
        const result = await detectCtpVersion('/ctp2/install');
        expect(result).toBe('CTP2');
    });

    it('should return "CTP2" when both ctp_data and ctp2_data exist (prioritize CTP2)', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([
            'ctp_data',
            'ctp2_data',
        ] as never);
        const result = await detectCtpVersion('/mixed/install');
        expect(result).toBe('CTP2');
    });

    it('should return "Unknown" when neither ctp_data nor ctp2_data exist', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce(['other_folder'] as never);
        const result = await detectCtpVersion('/invalid/install');
        expect(result).toBe('Unknown');
    });

    it('should return "Unknown" when directory is empty', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockReturnValueOnce([] as never);
        const result = await detectCtpVersion('/empty/install');
        expect(result).toBe('Unknown');
    });

    it('should handle readdir errors gracefully', async () => {
        expect.hasAssertions();
        mockedFs.readdirSync.mockImplementationOnce(() => {
            throw new Error('Permission denied');
        });
        const result = await detectCtpVersion('/error/install');
        expect(result).toBe('Unknown');
    });
});
