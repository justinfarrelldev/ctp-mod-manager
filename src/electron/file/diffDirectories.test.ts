import { describe, it, vi, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach } from 'vitest';
import { diffDirectories } from './diffDirectories';
import { TextFileChange } from './getFileChangesToApplyMod';

vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/path'),
        getName: vi.fn().mockReturnValue('mock-name'),
    },
}));
describe('diffDirectories', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
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

        expect(result.length).toBe(4);
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

    it(`should handle multi-line file changes`, () => {
        const oldDir = {
            src: {
                'index.js': `console.log("old line 1");
    console.log("old line 2");`,
            },
        };
        const newDir = {
            src: {
                'index.js': `console.log("new line 1");
    console.log("new line 2");`,
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(4);
        expect(result[0].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[1].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].changeType).toBe('add');

        expect(resultTextChanges[2].lineChangeGroups[0].startLineNumber).toBe(
            2
        );
        expect(resultTextChanges[2].lineChangeGroups[0].endLineNumber).toBe(2);
        expect(resultTextChanges[2].lineChangeGroups[0].changeType).toBe(
            'remove'
        );

        expect(resultTextChanges[3].lineChangeGroups[0].startLineNumber).toBe(
            2
        );
        expect(resultTextChanges[3].lineChangeGroups[0].endLineNumber).toBe(2);
        expect(resultTextChanges[3].lineChangeGroups[0].changeType).toBe('add');
    });

    it(`should handle added multi-line files`, () => {
        const oldDir = {
            src: {},
        };
        const newDir = {
            src: {
                'index.js': `console.log("new line 1");
    console.log("new line 2");`,
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(1);
        expect(result[0].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(2);
    });

    it(`should handle removed multi-line files`, () => {
        const oldDir = {
            src: {
                'index.js': `console.log("old line 1");
    console.log("old line 2");`,
            },
        };
        const newDir = {
            src: {},
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        console.log('result', result);

        expect(result.length).toBe(1);
        expect(result[0].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            0
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(2);
    });

    it(`should handle multiple files in different folders`, () => {
        const oldDir = {
            src: {
                'file1.slc': 'old content 1',
                'file2.pdf': 'old content 2',
                'file3.jpg': 'old content 3',
                subfolder: {
                    'file4.slc': 'old content 4',
                    'file5.pdf': 'old content 5',
                },
            },
        };
        const newDir = {
            src: {
                'file1.slc': 'new content 1',
                'file2.pdf': 'old content 2',
                'file3.jpg': 'new content 3',
                subfolder: {
                    'file4.slc': 'new content 4',
                    'file6.jpg': 'new content 6',
                },
            },
        };
        const result = diffDirectories({
            oldDir,
            newDir,
        });

        expect(result.length).toBe(7);
        expect(result[0].isBinary).toBe(false);
        expect(result[1].isBinary).toBe(false);
        expect(result[2].isBinary).toBe(true);
        expect(result[3].isBinary).toBe(true);
        expect(result[4].isBinary).toBe(false);

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[0].lineChangeGroups[0].changeType).toBe(
            'remove'
        );

        expect(resultTextChanges[1].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[1].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[1].lineChangeGroups[0].changeType).toBe('add');

        expect(resultTextChanges[2].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[2].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[2].lineChangeGroups[0].changeType).toBe(
            'replace'
        );

        expect(resultTextChanges[3].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[3].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[3].lineChangeGroups[0].changeType).toBe(
            'replace'
        );

        expect(resultTextChanges[4].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[4].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[4].lineChangeGroups[0].changeType).toBe(
            'remove'
        );

        expect(resultTextChanges[5].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[5].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[5].lineChangeGroups[0].changeType).toBe('add');

        expect(resultTextChanges[6].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[6].lineChangeGroups[0].endLineNumber).toBe(1);
        expect(resultTextChanges[6].lineChangeGroups[0].changeType).toBe('add');
    });
});
