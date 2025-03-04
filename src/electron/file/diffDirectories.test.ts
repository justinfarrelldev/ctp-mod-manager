import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { countLines, diffDirectories } from './diffDirectories';
import { TextFileChange } from './fileChange';

vi.mock('electron', () => ({
    app: {
        getName: vi.fn().mockReturnValue('mock-name'),
        getPath: vi.fn().mockReturnValue('/mock/path'),
    },
}));
describe('diffDirectories', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
    it(`should be able to diff nested directories`, async () => {
        expect.hasAssertions();
        // @ts-expect-error This is a mock
        vi.spyOn(fs, 'readdirSync').mockImplementation((dirPath: string) => {
            const structure: Record<string, string[]> = {
                '/mock/newDir/src': ['index.js', 'utils'],
                '/mock/newDir/src/utils': ['helper.js'],
                '/mock/oldDir/src': ['index.js', 'utils'],
                '/mock/oldDir/src/utils': ['helper.js'],
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
        const result = await diffDirectories({
            newDir,
            oldDir,
        });

        expect(result).toHaveLength(4);
        expect(result[0].isBinary).toBeFalsy();
        expect(result[1].isBinary).toBeFalsy();

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

    it(`should handle multi-line file changes`, async () => {
        expect.hasAssertions();
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
        const result = await diffDirectories({
            newDir,
            oldDir,
        });

        expect(result).toHaveLength(4);
        expect(result[0].isBinary).toBeFalsy();

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

    it(`should handle added multi-line files`, async () => {
        expect.hasAssertions();
        const oldDir = {
            src: {},
        };
        const newDir = {
            src: {
                'index.js': `console.log("new line 1");
    console.log("new line 2");`,
            },
        };
        const result = await diffDirectories({
            newDir,
            oldDir,
        });

        expect(result).toHaveLength(1);
        expect(result[0].isBinary).toBeFalsy();

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(2);
    });

    it(`should handle removed multi-line files`, async () => {
        expect.hasAssertions();
        const oldDir = {
            src: {
                'index.js': `console.log("old line 1");
    console.log("old line 2");`,
            },
        };
        const newDir = {
            src: {},
        };
        const result = await diffDirectories({
            newDir,
            oldDir,
        });

        console.log('result', result);

        expect(result).toHaveLength(1);
        expect(result[0].isBinary).toBeFalsy();

        const resultTextChanges: TextFileChange[] = result as TextFileChange[];

        expect(resultTextChanges[0].lineChangeGroups[0].startLineNumber).toBe(
            1
        );
        expect(resultTextChanges[0].lineChangeGroups[0].endLineNumber).toBe(2);
    });

    it(`should ignore removed files when ignoreRemovedFiles option is set to true`, async () => {
        expect.hasAssertions();
        const oldDir = {
            src: {
                'index.js': `console.log("old line 1");
    console.log("old line 2");`,
                'removedFile.js': `console.log("this file will be removed");`,
            },
        };
        const newDir = {
            src: {
                'index.js': `console.log("new line 1");
    console.log("new line 2");`,
            },
        };
        const result = await diffDirectories({
            ignoreRemovedFiles: true,
            newDir,
            oldDir,
        });

        expect(result).toHaveLength(4);
        expect(result[0].isBinary).toBeFalsy();

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

    // Skipping this test as it is not deterministic and is flaky due to the test
    // expectations requiring that diffDirectories returns items in a specific order
    it.skip(`should handle multiple files in different folders`, async () => {
        expect.hasAssertions();
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
        const result = await diffDirectories({
            newDir,
            oldDir,
        });

        expect(result).toHaveLength(7);
        expect(result[0].isBinary).toBeFalsy();
        expect(result[1].isBinary).toBeFalsy();
        expect(result[2].isBinary).toBeTruthy();
        expect(result[3].isBinary).toBeTruthy();
        expect(result[4].isBinary).toBeFalsy();

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
describe('countLines', () => {
    it('should correctly count lines for empty string', () => {
        expect.assertions(1);
        const result = countLines('');
        expect(result).toBe(1); // Empty string counts as 1 line
    });

    it('should correctly count lines for single line', () => {
        expect.assertions(1);
        const result = countLines('This is a single line');
        expect(result).toBe(1);
    });

    it('should correctly count lines for multiple lines', () => {
        expect.assertions(1);

        const result = countLines('Line 1\nLine 2\nLine 3');
        expect(result).toBe(3);
    });

    it('should correctly count lines with trailing newline', () => {
        expect.assertions(1);

        const result = countLines('Line 1\nLine 2\n');
        expect(result).toBe(2);
    });

    it('should correctly count lines for complex text', () => {
        expect.assertions(1);

        const result = countLines('Line 1\n\nLine 3\nLine 4\n\nLine 6');
        expect(result).toBe(6);
    });
});
