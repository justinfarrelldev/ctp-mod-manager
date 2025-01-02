import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import { readDirectory } from './readDirectory';

vi.mock('node:fs');

describe('readDirectory', () => {
    it('should read an empty directory', () => {
        const dirPath = '/empty-dir';
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        const result = readDirectory(dirPath);

        expect(result).toEqual({});
    });

    it('should read a directory with files', () => {
        const dirPath = '/dir-with-files';

        const files = [
            {
                name: 'file1.txt',
                isDirectory: () => false,
                isFile: () => true,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
            },

            {
                name: 'file2.txt',
                isDirectory: () => false,
                isFile: () => true,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
            },
        ];

        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce(files);
        vi.spyOn(fs, 'readFileSync')
            .mockReturnValueOnce('Content of file1')
            .mockReturnValueOnce('Content of file2');

        const result = readDirectory(dirPath);

        expect(result).toEqual({
            'file1.txt': 'Content of file1',
            'file2.txt': 'Content of file2',
        });
    });

    it('should handle nested directories', () => {
        const dirPath = '/dir-with-nested';
        const subDirs = [
            {
                name: 'subdir1',
                isDirectory: () => true,
                isFile: () => false,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
            },

            {
                name: 'subdir2',
                isDirectory: () => true,
                isFile: () => false,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
            },
        ];
        const subdir1Files = [
            {
                name: 'file1.txt',
                isDirectory: () => false,
                isFile: () => true,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
            },
        ];
        const subdir2Files = [
            {
                name: 'file2.txt',
                isDirectory: () => false,
                isFile: () => true,
                isBlockDevice: () => false,
                isCharacterDevice: () => false,
                isSymbolicLink: () => false,
                isFIFO: () => false,
                isSocket: () => false,
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

        expect(result).toEqual({
            subdir1: {
                'file1.txt': 'Content of file1',
            },
            subdir2: {
                'file2.txt': 'Content of file2',
            },
        });
    });
});
