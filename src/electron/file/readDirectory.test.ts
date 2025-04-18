import fs from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { readDirectory } from './readDirectory';

vi.mock('node:fs');

describe('readDirectory', () => {
    it('should read an empty directory', () => {
        expect.assertions(1);
        const dirPath = '/empty-dir';
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        const result = readDirectory(dirPath);

        expect(result).toStrictEqual({});
    });

    it('should read a directory with files', () => {
        expect.assertions(1);
        const dirPath = '/dir-with-files';

        const files = [
            {
                isBlockDevice: (): false => false,
                isCharacterDevice: (): false => false,
                isDirectory: (): false => false,
                isFIFO: (): false => false,
                isFile: (): true => true,
                isSocket: (): false => false,
                isSymbolicLink: (): false => false,
                name: 'file1.txt',
            },

            {
                isBlockDevice: (): false => false,
                isCharacterDevice: (): false => false,
                isDirectory: (): false => false,
                isFIFO: (): false => false,
                isFile: (): true => true,
                isSocket: (): false => false,
                isSymbolicLink: (): false => false,
                name: 'file2.txt',
            },
        ];

        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce(files);
        vi.spyOn(fs, 'readFileSync')
            .mockReturnValueOnce('Content of file1')
            .mockReturnValueOnce('Content of file2');

        const result = readDirectory(dirPath);

        expect(result).toStrictEqual({
            'file1.txt': 'Content of file1',
            'file2.txt': 'Content of file2',
        });
    });

    it('should handle nested directories', () => {
        expect.hasAssertions();
        const dirPath = '/dir-with-nested';
        const subDirs = [
            {
                isBlockDevice: (): false => false,
                isCharacterDevice: (): false => false,
                isDirectory: (): true => true,
                isFIFO: (): false => false,
                isFile: (): false => false,
                isSocket: (): false => false,
                isSymbolicLink: (): false => false,
                name: 'subdir1',
            },

            {
                isBlockDevice: (): false => false,
                isCharacterDevice: (): false => false,
                isDirectory: (): true => true,
                isFIFO: (): false => false,
                isFile: (): false => false,
                isSocket: (): false => false,
                isSymbolicLink: (): false => false,
                name: 'subdir2',
            },
        ];
        const subdir1Files = [
            {
                isBlockDevice: (): false => false,
                isCharacterDevice: (): false => false,
                isDirectory: (): false => false,
                isFIFO: (): false => false,
                isFile: (): true => true,
                isSocket: (): false => false,
                isSymbolicLink: (): false => false,
                name: 'file1.txt',
            },
        ];
        const subdir2Files = [
            {
                isBlockDevice: (): false => false,
                isCharacterDevice: (): false => false,
                isDirectory: (): false => false,
                isFIFO: (): false => false,
                isFile: (): true => true,
                isSocket: (): false => false,
                isSymbolicLink: (): false => false,
                name: 'file2.txt',
            },
        ];

        vi.spyOn(fs, 'readdirSync')
            .mockReturnValueOnce(subDirs) // Initial directory
            .mockReturnValueOnce(subdir1Files) // subdir1
            .mockReturnValueOnce(subdir2Files); // subdir2

        vi.spyOn(fs, 'readFileSync')
            .mockReturnValueOnce('Content of file1')
            .mockReturnValueOnce('Content of file2');

        const result = readDirectory(dirPath);

        expect(result).toStrictEqual({
            subdir1: {
                'file1.txt': 'Content of file1',
            },
            subdir2: {
                'file2.txt': 'Content of file2',
            },
        });
    });
});
