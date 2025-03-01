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

    it('should consolidate 6 file changes (flattened) into 3 replace operations with the expected content', () => {
        const fileChanges = [
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 2,
                        endLineNumber: 2,
                        changeType: 'remove',
                        oldContent:
                            'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 2,
                        endLineNumber: 2,
                        changeType: 'add',
                        newContent:
                            'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 3,
                        endLineNumber: 3,
                        changeType: 'remove',
                        oldContent:
                            'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 3,
                        endLineNumber: 3,
                        changeType: 'add',
                        newContent:
                            'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 4,
                        endLineNumber: 4,
                        changeType: 'remove',
                        oldContent:
                            'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                    },
                ],
                isBinary: false,
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                lineChangeGroups: [
                    {
                        startLineNumber: 4,
                        endLineNumber: 4,
                        changeType: 'add',
                        newContent:
                            'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
                    },
                ],
                isBinary: false,
            },
        ];

        // Flatten all line change groups into a single array
        const allLineChangeGroups = fileChanges.flatMap(
            (fc) => fc.lineChangeGroups as LineChangeGroup[]
        );

        const consolidated = consolidateLineChangeGroups(allLineChangeGroups);

        const expected = [
            {
                changeType: 'replace',
                startLineNumber: 2,
                endLineNumber: 2,
                oldContent:
                    'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                newContent:
                    'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
            },
            {
                changeType: 'replace',
                startLineNumber: 3,
                endLineNumber: 3,
                oldContent:
                    'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                newContent:
                    'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
            },
            {
                changeType: 'replace',
                startLineNumber: 4,
                endLineNumber: 4,
                oldContent:
                    'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                newContent:
                    'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
            },
        ];

        // Ensure that we get 3 consolidated line change groups and all of them are "replace" types.
        expect(consolidated).toEqual(expected);
    });
});
