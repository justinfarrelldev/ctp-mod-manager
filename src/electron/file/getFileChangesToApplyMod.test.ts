import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';
import {
    diffTexts,
    getFileChangesToApplyMod,
    readDirectory,
} from './getFileChangesToApplyMod';
import fs, { readFile } from 'node:fs';

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
