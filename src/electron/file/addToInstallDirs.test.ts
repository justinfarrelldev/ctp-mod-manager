import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs';
import {
    addToInstallDirs,
    ensureInstallsFolderExists,
    ensureInstallFileExists,
    parseInstallFileIntoJSON,
} from './addToInstallDirs';
import {
    DEFAULT_INSTALLS_DIR,
    DEFAULT_INSTALLS_FILE,
    DEFAULT_INSTALLS_FOLDER_NAME,
} from '../constants';
import { createAppDataFolder } from './copyFileToModDir';

vi.mock('fs');
vi.mock('./copyFileToModDir', () => ({
    createAppDataFolder: vi.fn(),
}));

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('addToInstallDirs', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should ensure the installs folder exists', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => true }) as fs.Stats
        );
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('[]');
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await addToInstallDirs('/new/dir');

        expect(createAppDataFolder).not.toHaveBeenCalled();
    });

    it('should create the installs folder if it does not exist', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('not found');
        });
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => true }) as fs.Stats
        );
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('[]');
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await addToInstallDirs('/new/dir');

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            JSON.stringify(['/new/dir'])
        );
    });

    it('should create the installs file if it does not exist', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => true }) as fs.Stats
        );
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('not found');
        });
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await addToInstallDirs('/new/dir');

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            JSON.stringify(['/new/dir'])
        );
    });

    it('should add a new directory to the installs file', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => true }) as fs.Stats
        );
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('[]');
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await addToInstallDirs('/new/dir');

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            JSON.stringify(['/new/dir'])
        );
    });

    it('should not add a directory if it already exists in the installs file', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => true }) as fs.Stats
        );
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('["/existing/dir"]');
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await addToInstallDirs('/existing/dir');

        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle errors during file operations', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('stat error');
        });

        await addToInstallDirs('/new/dir');

        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
