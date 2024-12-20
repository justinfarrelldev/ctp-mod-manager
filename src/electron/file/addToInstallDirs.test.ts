import { describe, it, expect, vi, afterAll } from 'vitest';
import * as fs from 'fs';
import {
    addToInstallDirs,
    ensureInstallFileExists,
    ensureInstallsFolderExists,
    parseInstallFileIntoJSON,
    writeJsonArrayToFile,
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
describe('ensureInstallsFolderExists', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should ensure the installs folder exists', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => true }) as fs.Stats
        );

        await ensureInstallsFolderExists();

        expect(createAppDataFolder).not.toHaveBeenCalled();
    });

    it('should create the installs folder if it does not exist', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('not found');
        });

        await ensureInstallsFolderExists();

        expect(createAppDataFolder).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FOLDER_NAME
        );
    });

    it('should create the installs folder if the path is not a directory', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => false }) as fs.Stats
        );

        await ensureInstallsFolderExists();

        expect(createAppDataFolder).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FOLDER_NAME
        );
    });
    it('should handle errors during folder operations', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('stat error');
        });

        await ensureInstallsFolderExists();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `An error occurred while getting the stats for the directory ${DEFAULT_INSTALLS_DIR}: Error: stat error`
        );
    });
});
describe('ensureInstallFileExists', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should create the installs file with the provided directory if it does not exist', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('not found');
        });
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await ensureInstallFileExists('/new/dir');

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            JSON.stringify(['/new/dir'])
        );
    });

    it('should create the installs file with an empty array if no directory is provided and the file does not exist', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('not found');
        });
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await ensureInstallFileExists();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            '[]'
        );
    });

    it('should not create the installs file if it already exists', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => true, isDirectory: () => false }) as fs.Stats
        );
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await ensureInstallFileExists('/new/dir');

        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle errors during file operations', async () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.spyOn(fs, 'statSync').mockImplementationOnce(() => {
            throw new Error('stat error');
        });
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
            throw new Error('write error');
        });

        await ensureInstallFileExists('/new/dir');

        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should create the installs file if the path is not a file', async () => {
        vi.spyOn(fs, 'statSync').mockImplementationOnce(
            () => ({ isFile: () => false, isDirectory: () => true }) as fs.Stats
        );
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        await ensureInstallFileExists('/new/dir');

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            JSON.stringify(['/new/dir'])
        );
    });
});
describe('parseInstallFileIntoJSON', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should parse the installs file into JSON', () => {
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('["/existing/dir"]');

        const result = parseInstallFileIntoJSON();

        expect(result).toEqual(['/existing/dir']);
    });

    it('should return an empty array if the installs file is empty', () => {
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('');

        const result = parseInstallFileIntoJSON();

        expect(result).toEqual([]);
    });

    it('should handle errors during file reading', () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
            throw new Error('read error');
        });

        const result = parseInstallFileIntoJSON();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `An error occurred while reading the file ${DEFAULT_INSTALLS_FILE}: Error: read error`
        );
        expect(result).toEqual([]);
    });

    it('should handle errors during JSON parsing', () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('invalid json');

        const result = parseInstallFileIntoJSON();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'An error occurred while converting the file contents to JSON: SyntaxError: Unexpected token i in JSON at position 0'
        );
        expect(result).toEqual([]);
    });
});
describe('writeJsonArrayToFile', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should write the JSON array to the file', () => {
        const jsonArray = '["/new/dir"]';
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {});

        writeJsonArrayToFile(jsonArray);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            DEFAULT_INSTALLS_FILE,
            jsonArray
        );
    });

    it('should handle errors during file writing', () => {
        const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const jsonArray = '["/new/dir"]';
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
            throw new Error('write error');
        });

        writeJsonArrayToFile(jsonArray);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            `An error occurred while writing to the file ${DEFAULT_INSTALLS_FILE}: Error: write error`
        );
    });
});
