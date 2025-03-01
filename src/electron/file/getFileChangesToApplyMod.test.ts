import { describe, it, expect, vi } from 'vitest';
import { consolidateLineChangeGroups } from './getFileChangesToApplyMod';
import { LineChangeGroup } from './lineChangeGroup';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));

describe('consolidateLineChangeGroups', () => {
    it('should consolidate matching remove/add pairs into replace operations', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 1,
                endLineNumber: 1,
                newContent: 'bar',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'replace',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
                newContent: 'bar',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should not consolidate non-matching remove/add pairs', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle multiple matching remove/add pairs', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 1,
                endLineNumber: 1,
                newContent: 'bar',
            },
            {
                changeType: 'remove',
                startLineNumber: 2,
                endLineNumber: 2,
                oldContent: 'baz',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'qux',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'replace',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
                newContent: 'bar',
            },
            {
                changeType: 'replace',
                startLineNumber: 2,
                endLineNumber: 2,
                oldContent: 'baz',
                newContent: 'qux',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle non-matching changes', () => {
        const input: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
            {
                changeType: 'remove',
                startLineNumber: 3,
                endLineNumber: 3,
                oldContent: 'baz',
            },
        ];

        const expected: LineChangeGroup[] = [
            {
                changeType: 'remove',
                startLineNumber: 1,
                endLineNumber: 1,
                oldContent: 'foo',
            },
            {
                changeType: 'add',
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'bar',
            },
            {
                changeType: 'remove',
                startLineNumber: 3,
                endLineNumber: 3,
                oldContent: 'baz',
            },
        ];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });

    it('should handle empty input', () => {
        const input: LineChangeGroup[] = [];

        const expected: LineChangeGroup[] = [];

        expect(consolidateLineChangeGroups(input)).toEqual(expected);
    });
});
