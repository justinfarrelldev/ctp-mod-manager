import { describe, expect, it } from 'vitest';

import { textFileChangesAreConflicting } from './applyFileChanges';
import { TextFileChange } from './fileChange';

describe('textFileChangesAreConflicting', () => {
    it('should return true for overlapping changes', () => {
        expect.hasAssertions();
        const fileChanges: TextFileChange[] = [
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'remove',
                        endLineNumber: 2,
                        oldContent:
                            'COLORSET_COLOR\t\t196 0 38\t\t#\tCOLOR_PLAYER0   \t\t\t',
                        startLineNumber: 2,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'add',
                        endLineNumber: 2,
                        newContent:
                            'COLORSET_COLOR\t\t32 32 32\t\t#\tCOLOR_PLAYER0   \t\t\t',
                        startLineNumber: 2,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'remove',
                        endLineNumber: 3,
                        oldContent:
                            'COLORSET_COLOR\t\t138 59 204\t\t#\tCOLOR_PLAYER5   \t\t\t',
                        startLineNumber: 3,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'add',
                        endLineNumber: 3,
                        newContent:
                            'COLORSET_COLOR\t\t200 0 0\t\t\t#\tCOLOR_PLAYER5   \t\t\t',
                        startLineNumber: 3,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'remove',
                        endLineNumber: 4,
                        oldContent:
                            'COLORSET_COLOR\t\t137 98 53\t\t#\tCOLOR_PLAYER8   \t\t\t',
                        startLineNumber: 4,
                    },
                ],
            },
            {
                fileName: 'ctp2_data/default/gamedata/Colors00.txt',
                isBinary: false,
                lineChangeGroups: [
                    {
                        changeType: 'add',
                        endLineNumber: 4,
                        newContent:
                            'COLORSET_COLOR\t\t255 255 64\t\t#\tCOLOR_PLAYER8   \t\t\t',
                        startLineNumber: 4,
                    },
                ],
            },
        ];

        expect(textFileChangesAreConflicting(fileChanges)).toBeTruthy();
    });
});
