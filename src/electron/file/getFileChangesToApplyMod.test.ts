import {
    describe,
    it,
    expect,
    vi,
    afterEach,
    afterAll,
    beforeEach,
} from 'vitest';
import {
    diffTexts,
    getFileChangesToApplyMod,
    processDirectory,
    processFileEntries,
    readDirectory,
} from './getFileChangesToApplyMod';
import fs, { readFile, StatSyncFn } from 'node:fs';
import path from 'node:path';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('diffTexts', () => {
    it('should return no differences for identical texts', () => {
        const text1 = 'Hello, world!';
        const text2 = 'Hello, world!';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([[0, 'Hello, world!']]);
    });

    it('should detect added lines', () => {
        const text1 = 'Hello, world!';
        const text2 = 'Hello, world!\nNew line here.';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'Hello, world!'],
            [1, '\nNew line here.'],
        ]);
    });

    it('should detect removed lines', () => {
        const text1 = 'Hello, world!\nThis line will be removed.';
        const text2 = 'Hello, world!';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'Hello, world!'],
            [-1, '\nThis line will be removed.'],
        ]);
    });

    it('should detect changed lines', () => {
        const text1 = 'Hello, world!';
        const text2 = 'Hello, universe!';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'Hello, '],
            [-1, 'world'],
            [1, 'universe'],
            [0, '!'],
        ]);
    });

    it('should handle empty texts', () => {
        const text1 = '';
        const text2 = '';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([]);
    });

    it('should handle one empty text', () => {
        const text1 = 'Hello, world!';
        const text2 = '';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([[-1, 'Hello, world!']]);
    });

    it('should handle large texts', () => {
        const text1 = 'a'.repeat(10000);
        const text2 = 'a'.repeat(9999) + 'b';
        const diffs = diffTexts(text1, text2);
        expect(diffs).toEqual([
            [0, 'a'.repeat(9999)],
            [-1, 'a'],
            [1, 'b'],
        ]);
    });
});

describe('readDirectory', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should read an empty directory', () => {
        const mock = vi.spyOn(fs, 'readdirSync').mockReturnValue([]);

        const result = readDirectory('/mock/empty-dir');
        expect(result).toEqual({});
        expect(mock).toHaveBeenCalledWith('/mock/empty-dir', {
            withFileTypes: true,
        });
    });
});
describe('readDirectory (extended tests)', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });
    it('should read a nested directory structure with one subdirectory and one file', () => {
        const mock = vi
            .spyOn(fs, 'readdirSync')
            .mockImplementation((dirPath: string) => {
                if (dirPath === '/mock/nested-dir') {
                    return [
                        {
                            name: 'subdir',
                            isDirectory: () => true,
                            isFile: () => false,
                        },
                        {
                            name: 'topFile.txt',
                            isDirectory: () => false,
                            isFile: () => true,
                        },
                    ] as any;
                } else if (dirPath === '/mock/nested-dir/subdir') {
                    return [
                        {
                            name: 'insideFile.txt',
                            isDirectory: () => false,
                            isFile: () => true,
                        },
                    ] as any;
                }
                return [];
            });
        const fileMock = vi
            .spyOn(fs, 'readFileSync')
            .mockImplementation((filePath: string) => {
                return `Content of ${filePath}`;
            });

        const result = readDirectory('/mock/nested-dir');
        expect(result).toEqual({
            subdir: {},
            'topFile.txt': 'Content of \\mock\\nested-dir\\topFile.txt',
        });
        mock.mockRestore();
        fileMock.mockRestore();
    });

    it('should handle directories with no subdirectories but multiple files', () => {
        const mock = vi.spyOn(fs, 'readdirSync').mockReturnValue([
            { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
            { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
        ] as any);
        const fileMock = vi
            .spyOn(fs, 'readFileSync')
            .mockImplementation((filePath: string) => {
                if (filePath.endsWith('file1.txt')) return 'File 1 content';
                if (filePath.endsWith('file2.txt')) return 'File 2 content';
                return '';
            });

        const result = readDirectory('/mock/simple-dir');
        expect(result).toEqual({
            'file1.txt': 'File 1 content',
            'file2.txt': 'File 2 content',
        });
        mock.mockRestore();
        fileMock.mockRestore();
    });

    it('should handle a directory containing itself in a circular reference gracefully', () => {
        const mock = vi
            .spyOn(fs, 'readdirSync')
            .mockImplementation((dirPath: string) => {
                if (dirPath === '/mock/circular') {
                    return [
                        {
                            name: 'circular',
                            isDirectory: () => true,
                            isFile: () => false,
                        },
                    ] as any;
                }
                return [];
            });
        const fileMock = vi.spyOn(fs, 'readFileSync');

        // The function won't actually detect cycles automatically, but it won't get stuck
        const result = readDirectory('/mock/circular');
        expect(result).toEqual({ circular: {} });

        mock.mockRestore();
        fileMock.mockRestore();
    });
});

describe('getFileChangesToApplyMod', () => {
    it('should log an error if the given mod path is not a directory', async () => {
        const consoleErrorMock = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const statMock = vi.spyOn(fs, 'statSync').mockImplementation(
            () =>
                ({
                    isDirectory: () => false,
                }) as any
        );

        const result = await getFileChangesToApplyMod('notADir', '/game/dir');
        expect(result).toBeUndefined();
        expect(consoleErrorMock).toHaveBeenCalled();

        consoleErrorMock.mockRestore();
        statMock.mockRestore();
    });

    it('should correctly handle directory paths and attempt to compare directories', async () => {
        const consoleLogMock = vi
            .spyOn(console, 'log')
            .mockImplementation(() => {});
        const statMock = vi.spyOn(fs, 'statSync').mockImplementation(
            () =>
                ({
                    isDirectory: () => true,
                }) as any
        );
        const readMock = vi.spyOn(fs, 'readdirSync').mockReturnValue([] as any);

        const result = await getFileChangesToApplyMod('someDir', '/game/dir');
        expect(result).toBeUndefined();
        expect(consoleLogMock).toHaveBeenCalledWith(
            'reading mod dir structure!'
        );
        expect(consoleLogMock).toHaveBeenCalledWith(
            'reading game dir structure!'
        );
        expect(consoleLogMock).toHaveBeenCalledWith('comparing dirs!');

        consoleLogMock.mockRestore();
        statMock.mockRestore();
        readMock.mockRestore();
    });
});
describe('processFileEntries', () => {
    let fileDiffPromises: Promise<any>[];
    let changes: any[];

    beforeEach(() => {
        fileDiffPromises = [];
        changes = [];
    });

    it('should detect no changes if files are identical text', () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 100 } as any);
        mockRead.mockImplementation((filePath: string) => {
            return 'Same content';
        });

        // Identical textual files
        processFileEntries(
            'path/to/oldFile.txt',
            'path/to/newFile.txt',
            'testFile.txt',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(0);

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should detect changes if textual files differ', async () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 200 } as any);
        mockRead.mockImplementation((filePath: string) => {
            return filePath.includes('oldFile') ? 'Old content' : 'New content';
        });

        processFileEntries(
            'path/to/oldFile.txt',
            'path/to/newFile.txt',
            'testFile.txt',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(1);

        const fileDiffResults = await Promise.all(fileDiffPromises);
        expect(fileDiffResults[0].fileName).toBe('testFile.txt');
        expect(fileDiffResults[0].changeDiffs).toBeDefined();

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should mark binary changes if special file sizes differ', () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        // Mark .pdf as special
        mockStat.mockImplementation(((filePath: string) =>
            filePath.includes('oldFile')
                ? { size: 123 }
                : { size: 456 }) as any);
        mockRead.mockReturnValue('fake');

        processFileEntries(
            'oldFile.pdf',
            'newFile.pdf',
            'testFile.pdf',
            fileDiffPromises,
            changes
        );

        expect(changes).toEqual([
            {
                fileName: 'testFile.pdf',
                isBinary: true,
            },
        ]);
        expect(fileDiffPromises).toHaveLength(0);

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should not add binary changes if special files have same size', () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 100 } as any);
        mockRead.mockReturnValue('irrelevant');

        processFileEntries(
            'file.tga',
            'file.tga',
            'sameSize.tga',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(0);

        mockStat.mockRestore();
        mockRead.mockRestore();
    });

    it('should handle large text files by splitting lines correctly', async () => {
        const mockStat = vi.spyOn(fs, 'statSync');
        const mockRead = vi.spyOn(fs, 'readFileSync');

        mockStat.mockReturnValue({ size: 9999 } as any);
        // Over 400 lines
        mockRead.mockImplementation((filePath: string) =>
            filePath.includes('oldFile')
                ? 'Old\n'.repeat(401)
                : 'New\n'.repeat(401)
        );

        processFileEntries(
            'oldFile.txt',
            'newFile.txt',
            'largeDiff.txt',
            fileDiffPromises,
            changes
        );

        expect(changes).toHaveLength(0);
        expect(fileDiffPromises).toHaveLength(1);

        const results = await Promise.all(fileDiffPromises);
        expect(results[0].fileName).toBe('largeDiff.txt');

        mockStat.mockRestore();
        mockRead.mockRestore();
    });
});
vi.mock('node:fs');

describe('processDirectory', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should return an empty array for two empty directories', async () => {
        vi.spyOn(fs, 'readdirSync').mockReturnValue([]);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('');

        const oldDir = {};
        const newDir = {};
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toEqual([]);
    });

    it('should detect added text file in new directory', async () => {
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            if (dirPath === '/mock/newDir') {
                return ['file.txt'];
            }
            return [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (filePath === path.join('/mock/newDir', 'file.txt')) {
                return 'Some content';
            }
            return '';
        });

        const oldDir = {};
        const newDir = {
            'file.txt': 'Some content',
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toHaveLength(1);
        expect(result[0].lineChangeGroups).toHaveLength(1);
        expect(result[0].lineChangeGroups[0].change).toBe('Some content');
        expect(result[0].lineChangeGroups[0].contentBeforeChange).toBe('');
    });

    it('should detect modified text and return correct line groups', async () => {
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            if (dirPath === '/mock/oldDir') {
                return ['README.md'];
            }
            if (dirPath === '/mock/newDir') {
                return ['README.md'];
            }
            return [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (filePath === path.join('/mock/oldDir', 'README.md')) {
                return 'Line1\nLine2\nLine3';
            }
            if (filePath === path.join('/mock/newDir', 'README.md')) {
                return 'Line1\nLine2 changed\nLine3';
            }
            return '';
        });

        const oldDir = { 'README.md': 'Line1\nLine2\nLine3' };
        const newDir = { 'README.md': 'Line1\nLine2 changed\nLine3' };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe('README.md');
        expect(result[0].lineChangeGroups).toHaveLength(1);
        expect(result[0].lineChangeGroups[0].change).toContain('Line2 changed');
        expect(result[0].lineChangeGroups[0].contentBeforeChange).toContain(
            'Line2'
        );
    });

    it('should handle nested directories with changes', async () => {
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir/src': ['index.js', 'utils'],
                '/mock/oldDir/src/utils': ['helper.js'],
                '/mock/newDir/src': ['index.js', 'utils'],
                '/mock/newDir/src/utils': ['helper.js'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (filePath === path.join('/mock/oldDir/src', 'index.js')) {
                return 'console.log("old");';
            }
            if (filePath === path.join('/mock/newDir/src', 'index.js')) {
                return 'console.log("new");';
            }
            if (filePath === path.join('/mock/oldDir/src/utils', 'helper.js')) {
                return 'function helper() {}';
            }
            if (filePath === path.join('/mock/newDir/src/utils', 'helper.js')) {
                return 'function helper() { console.log("updated"); }';
            }
            return '';
        });

        const oldDir = {
            src: {
                'index.js': 'console.log("old");',
                utils: {
                    'helper.js': 'function helper() {}',
                },
            },
        };
        const newDir = {
            src: {
                'index.js': 'console.log("new");',
                utils: {
                    'helper.js':
                        'function helper() { console.log("updated"); }',
                },
            },
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result.length).toBe(2);

        const indexChange = result.find(
            (r: any) => r.fileName === 'src/index.js'
        );
        const helperChange = result.find(
            (r: any) => r.fileName === 'src/utils/helper.js'
        );

        expect(indexChange.lineChangeGroups).toHaveLength(1);
        expect(helperChange.lineChangeGroups).toHaveLength(1);
        expect(indexChange.lineChangeGroups[0].contentBeforeChange).toContain(
            'old'
        );
        expect(helperChange.lineChangeGroups[0].change).toContain('updated');
    });

    it('should detect no changes if files and nested dirs are identical', async () => {
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir/src': ['app.txt', 'assets'],
                '/mock/newDir/src': ['app.txt', 'assets'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            return 'same content';
        });

        const oldDir = {
            src: {
                'app.txt': 'same content',
                assets: {},
            },
        };
        const newDir = {
            src: {
                'app.txt': 'same content',
                assets: {},
            },
        };
        const result = await (processDirectory as any)(oldDir, newDir);
        expect(result).toEqual([]);
    });
});
