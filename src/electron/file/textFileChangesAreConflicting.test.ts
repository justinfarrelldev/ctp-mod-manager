import { describe, it, expect } from 'vitest';
import { textFileChangesAreConflicting } from './applyFileChanges';
import { TextFileChange } from './fileChange';

describe('textFileChangesAreConflicting', () => {
    it('should return true for overlapping changes', () => {
        const fileChanges: TextFileChange[] = [
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

        expect(textFileChangesAreConflicting(fileChanges)).toBe(true);
    });
});
