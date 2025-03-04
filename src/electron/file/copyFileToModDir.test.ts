import AdmZip from 'adm-zip';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_MOD_DIR } from '../constants';
import { unzipInModDir } from './copyFileToModDir';

vi.mock('fs');
vi.mock('adm-zip');
vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('unzipInModDir', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should extract the zip file to the correct directory', async () => {
        expect.assertions(1);
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
        expect.assertions(1);
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
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .mockImplementation(() => {});

        await unzipInModDir('/path/to/zipfile.zip', 'zipfile.zip');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'An error occurred while extracting /path/to/zipfile.zip: Error: extract error'
        );
    });

    it('should log an error if zip file creation fails', async () => {
        expect.assertions(1);
        vi.mocked(AdmZip).mockImplementationOnce(() => {
            throw new Error('zip creation error');
        });
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .mockImplementation(() => {});

        await unzipInModDir('/path/to/zipfile.zip', 'zipfile.zip');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Failed to unzip: Error: zip creation error'
        );
    });
});
