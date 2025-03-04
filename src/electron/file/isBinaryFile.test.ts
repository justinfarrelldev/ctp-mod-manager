import { describe, expect, it } from 'vitest';

import { isBinaryFile } from './isBinaryFile';

describe('isBinaryFile', () => {
    it('should return true for a file with a special extension', () => {
        expect.hasAssertions();
        expect(isBinaryFile('example.tga')).toBeTruthy();
        expect(isBinaryFile('example.PDF')).toBeTruthy();
        expect(isBinaryFile('example.exe')).toBeTruthy();
    });

    it('should return false for a file without a special extension', () => {
        expect.hasAssertions();

        expect(isBinaryFile('example.txt')).toBeFalsy();
        expect(isBinaryFile('example.doc')).toBeFalsy();
        expect(isBinaryFile('example.png')).toBeFalsy();
    });

    it('should handle file paths with mixed case extensions', () => {
        expect.hasAssertions();

        expect(isBinaryFile('example.TiF')).toBeTruthy();
        expect(isBinaryFile('example.GiF')).toBeTruthy();
    });

    it('should return false for a file with no extension', () => {
        expect.hasAssertions();

        expect(isBinaryFile('example')).toBeFalsy();
    });

    it('should return false for a file with an unknown extension', () => {
        expect.hasAssertions();

        expect(isBinaryFile('example.unknown')).toBeFalsy();
    });
});
