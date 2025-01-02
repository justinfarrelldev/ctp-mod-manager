import { describe, it, expect } from 'vitest';
import { isBinaryFile } from './isBinaryFile';

describe('isBinaryFile', () => {
    it('should return true for a file with a special extension', () => {
        expect(isBinaryFile('example.tga')).toBe(true);
        expect(isBinaryFile('example.PDF')).toBe(true);
        expect(isBinaryFile('example.exe')).toBe(true);
    });

    it('should return false for a file without a special extension', () => {
        expect(isBinaryFile('example.txt')).toBe(false);
        expect(isBinaryFile('example.doc')).toBe(false);
        expect(isBinaryFile('example.png')).toBe(false);
    });

    it('should handle file paths with mixed case extensions', () => {
        expect(isBinaryFile('example.TiF')).toBe(true);
        expect(isBinaryFile('example.GiF')).toBe(true);
    });

    it('should return false for a file with no extension', () => {
        expect(isBinaryFile('example')).toBe(false);
    });

    it('should return false for a file with an unknown extension', () => {
        expect(isBinaryFile('example.unknown')).toBe(false);
    });
});
