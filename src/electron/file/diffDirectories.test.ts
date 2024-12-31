import { describe, it, vi, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    convertFileDiffToFileChange,
    diffDirectories,
} from './diffDirectories';
import {
    BinaryFileChange,
    FileDiff,
    LineChangeGroupAdd,
    LineChangeGroupRemove,
    LineChangeGroupReplace,
    TextFileChange,
} from './getFileChangesToApplyMod';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));
describe('diffDirectories', () => {
    it(`should be able to diff nested directories`, () => {
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/oldDir/src': ['index.js', 'utils'],
                '/mock/oldDir/src/utils': ['helper.js'],
                '/mock/newDir/src': ['index.js', 'utils'],
                '/mock/newDir/src/utils': ['helper.js'],
            };
            return structure[dirPath] || [];
        });
        vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: string) => {
            if (filePath === path.join('/mock/oldDir/src', 'index.js')) {
                return 'console.log("old");';
            }
            if (filePath === path.join('/mock/newDir/src', 'index.js')) {
                return 'console.log("new");';
            }
            if (filePath === path.join('/mock/oldDir/src/utils', 'helper.js')) {
                return 'function helper() {}';
            }
            if (filePath === path.join('/mock/newDir/src/utils', 'helper.js')) {
                return 'function helper() { console.log("updated"); }';
            }
            return '';
        });

        const oldDir = {
            src: {
                'index.js': 'console.log("old");',
                utils: {
                    'helper.js': 'function helper() {}',
                },
            },
        };
        const newDir = {
            src: {
                'index.js': 'console.log("new");',
                utils: {
                    'helper.js':
                        'function helper() { console.log("updated"); }',
                },
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(2);
        expect(result[0].isBinary).toBe(false);
        expect(result[1].isBinary).toBe(false);

        // appease typescript
        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[1].lineChangeGroups[0].endLineNumber).toBe(1);

        console.log('resultTextChanges', resultTextChanges[0].lineChangeGroups);
    });
});

describe('convertFileDiffToFileChange', () => {
    it('should correctly convert file diffs to file changes for text files', () => {
        const fileDiff: FileDiff = {
            fileName: 'test.txt',
            changeDiffs: [
                { count: 1, value: 'line 1', added: true },
                { count: 1, value: 'line 2', removed: true },
                { count: 1, value: 'line 3' },
            ],
        };

        const result = convertFileDiffToFileChange(fileDiff);

        expect(result.fileName).toBe('test.txt');
        expect(result.isBinary).toBe(false);

        const textFileChange = result as TextFileChange;

        const lineChangeGroupAdd: LineChangeGroupAdd = textFileChange
            .lineChangeGroups[0] as LineChangeGroupAdd;

        const lineChangeGroupRemove: LineChangeGroupRemove = textFileChange
            .lineChangeGroups[1] as LineChangeGroupRemove;

        const lineChangeGroupReplace: LineChangeGroupReplace = textFileChange
            .lineChangeGroups[2] as LineChangeGroupReplace;

        expect(textFileChange.lineChangeGroups.length).toBe(3);
        expect(lineChangeGroupAdd.startLineNumber).toBe(1);
        expect(lineChangeGroupAdd.endLineNumber).toBe(1);
        expect(lineChangeGroupAdd.changeType).toBe('add');
        expect(lineChangeGroupAdd.newContent).toBe('line 1');

        expect(lineChangeGroupRemove.startLineNumber).toBe(1);
        expect(lineChangeGroupRemove.endLineNumber).toBe(1);
        expect(lineChangeGroupRemove.changeType).toBe('remove');
        expect(lineChangeGroupRemove.oldContent).toBe('line 2');

        expect(lineChangeGroupReplace.startLineNumber).toBe(1);
        expect(lineChangeGroupReplace.endLineNumber).toBe(1);
        expect(lineChangeGroupReplace.changeType).toBe('replace');
        expect(lineChangeGroupReplace.newContent).toBe('line 3');
        expect(lineChangeGroupReplace.oldContent).toBe('line 3');
        expect(lineChangeGroupReplace.oldContent).toBe('line 3');
    });

    it('should correctly convert file diffs to file changes for binary files', () => {
        const fileDiff: FileDiff = {
            fileName: 'image.png',
            changeDiffs: [{ count: 1, value: 'binary data', added: true }],
        };

        const result = convertFileDiffToFileChange(fileDiff);

        expect(result.fileName).toBe('image.png');
        expect(result.isBinary).toBe(true);
    });
});
