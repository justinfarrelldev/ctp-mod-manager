import fs from 'fs';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { DEFAULT_MOD_DIR } from '../constants';
import { loadModFileNames } from './loadModFileNames';

vi.mock('fs');
vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));

describe('loadModFileNames', () => {
    afterAll(() => {
        vi.clearAllMocks();
    });

    it('should create the directory if it does not exist', () => {
        // Mock for this test case
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {});
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        loadModFileNames();

        expect(fs.existsSync).toHaveBeenCalledWith(DEFAULT_MOD_DIR);
        expect(fs.mkdirSync).toHaveBeenCalledWith(DEFAULT_MOD_DIR);
    });

    it('should return an array of filenames if directory exists', () => {
        // Mock for this test case
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
        const mockFiles = ['mod1', 'mod2', 'mod3'];
        // @ts-expect-error This is a valid list
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce(mockFiles);

        const result = loadModFileNames();

        expect(result).toEqual(mockFiles);
    });

    it('should return an empty array if directory is empty', () => {
        // Mock for this test case
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        const result = loadModFileNames();

        expect(result).toEqual([]);
    });

    it('should throw an error if there is an issue reading the files', () => {
        // Mock for this test case
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
        const mockError = new Error('Read error');
        vi.spyOn(fs, 'readdirSync').mockImplementationOnce(() => {
            throw mockError;
        });

        expect(() => loadModFileNames()).toThrow(mockError);
    });

    it('should not create the directory if it already exists', () => {
        // Mock for this test case
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {});
        vi.spyOn(fs, 'readdirSync').mockReturnValueOnce([]);

        loadModFileNames();

        expect(fs.existsSync).toHaveBeenCalledWith(DEFAULT_MOD_DIR);
        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
});
