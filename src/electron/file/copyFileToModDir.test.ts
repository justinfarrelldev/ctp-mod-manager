import { describe, it, expect, vi, afterAll } from 'vitest';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { unzipInModDir } from './copyFileToModDir';
import { DEFAULT_MOD_DIR } from '../constants';

vi.mock('fs');
vi.mock('adm-zip');
vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('unzipInModDir', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should extract the zip file to the correct directory', async () => {
        const mockExtractAllToAsync = vi.fn((_, __, ___, callback) =>
            callback()
        );
        vi.mocked(AdmZip).mockImplementationOnce(
            () =>
                ({
                    extractAllToAsync: mockExtractAllToAsync,
                }) as unknown as AdmZip
        );

        await unzipInModDir('/path/to/zipfile.zip', 'zipfile.zip');

        expect(mockExtractAllToAsync).toHaveBeenCalledWith(
            `${DEFAULT_MOD_DIR}\\zipfile`,
            false,
            false,
            expect.any(Function)
        );
    });

    it('should log an error if extraction fails', async () => {
        const mockExtractAllToAsync = vi.fn((_, __, ___, callback) =>
            callback(new Error('extract error'))
        );
        vi.mocked(AdmZip).mockImplementationOnce(
            () =>
                ({
                    extractAllToAsync: mockExtractAllToAsync,
                }) as unknown as AdmZip
        );
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await unzipInModDir('/path/to/zipfile.zip', 'zipfile.zip');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'An error occurred while extracting /path/to/zipfile.zip: Error: extract error'
        );
    });

    it('should log an error if zip file creation fails', async () => {
        vi.mocked(AdmZip).mockImplementationOnce(() => {
            throw new Error('zip creation error');
        });
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        await unzipInModDir('/path/to/zipfile.zip', 'zipfile.zip');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to unzip: Error: zip creation error'
        );
    });
});
