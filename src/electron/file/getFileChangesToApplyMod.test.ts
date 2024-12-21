import { describe, it, expect, vi, afterEach } from 'vitest';
import { diffTexts, readDirectory } from './getFileChangesToApplyMod';
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
