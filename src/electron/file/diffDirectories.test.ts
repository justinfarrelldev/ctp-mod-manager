import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    countLines,
    diffDirectories,
    processFileChange,
} from './diffDirectories';
import { FileChange, TextFileChange } from './fileChange';
import { LineChangeGroupReplace } from './lineChangeGroup';

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

        expect(result).toHaveLength(2);
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
describe('processFileChange', () => {
    it('should handle added text files', async () => {
        expect.hasAssertions();
        const fileName = 'newFile.txt';
        const newFileContents = 'This is a new file';
        const oldFileContents = '';
        const fullPath = '/mock/path/newFile.txt';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe(fullPath);
        expect(result[0].isBinary).toBeFalsy();
        expect(result[0].lineChangeGroups[0].changeType).toBe('add');
        expect(result[0].lineChangeGroups[0].newContent).toBe(newFileContents);
    });

    it('should handle removed text files', async () => {
        expect.hasAssertions();

        const fileName = 'oldFile.txt';
        const newFileContents = '';
        const oldFileContents = 'This is an old file';
        const fullPath = '/mock/path/oldFile.txt';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe(fullPath);
        expect(result[0].isBinary).toBeFalsy();
        expect(result[0].lineChangeGroups[0].changeType).toBe('remove');
        expect(result[0].lineChangeGroups[0].oldContent).toBe(oldFileContents);
    });

    it('should handle changed text files', async () => {
        expect.hasAssertions();

        const fileName = 'changedFile.txt';
        const newFileContents = 'This is the new content';
        const oldFileContents = 'This is the old content';
        const fullPath = '/mock/path/changedFile.txt';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(2);
        expect(result[0].fileName).toBe(fullPath);
        expect(result[0].isBinary).toBeFalsy();
        expect(result[0].lineChangeGroups[0].changeType).toBe('remove');
        expect(result[0].lineChangeGroups[0].oldContent).toBe(oldFileContents);
        expect(result[1].fileName).toBe(fullPath);
        expect(result[1].isBinary).toBeFalsy();
        expect(result[1].lineChangeGroups[0].changeType).toBe('add');
        expect(result[1].lineChangeGroups[0].newContent).toBe(newFileContents);
    });

    it('should handle added binary files', async () => {
        expect.hasAssertions();

        const fileName = 'newFile.avi';
        const newFileContents = 'binary content';
        const oldFileContents = '';
        const fullPath = '/mock/path/newFile.avi';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe(fullPath);
        expect(result[0].isBinary).toBeTruthy();
        // all binary changes are 'replace' changes
        expect(
            (result[0] as TextFileChange).lineChangeGroups[0].changeType
        ).toBe('replace');
        expect(
            (
                (result[0] as TextFileChange)
                    .lineChangeGroups[0] as LineChangeGroupReplace
            ).newContent
        ).toBe(newFileContents);
    });

    it('should handle removed binary files', async () => {
        expect.hasAssertions();

        const fileName = 'oldFile.avi';
        const newFileContents = '';
        const oldFileContents = 'binary content';
        const fullPath = '/mock/path/oldFile.avi';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe(fullPath);
        expect(result[0].isBinary).toBeTruthy();
        // all binary changes are 'replace' changes
        expect(
            (result[0] as TextFileChange).lineChangeGroups[0].changeType
        ).toBe('replace');
        expect(
            (
                (result[0] as TextFileChange)
                    .lineChangeGroups[0] as LineChangeGroupReplace
            ).oldContent
        ).toBe(oldFileContents);
    });

    it('should handle changed binary files', async () => {
        expect.hasAssertions();

        const fileName = 'changedFile.avi';
        const newFileContents = 'new binary content';
        const oldFileContents = 'old binary content';
        const fullPath = '/mock/path/changedFile.avi';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(1);
        expect(result[0].fileName).toBe(fullPath);
        expect(result[0].isBinary).toBeTruthy();
        expect(
            (result[0] as TextFileChange).lineChangeGroups[0].changeType
        ).toBe('replace');
        expect(
            (
                (result[0] as TextFileChange)
                    .lineChangeGroups[0] as LineChangeGroupReplace
            ).newContent
        ).toBe(newFileContents);
        expect(
            (
                (result[0] as TextFileChange)
                    .lineChangeGroups[0] as LineChangeGroupReplace
            ).oldContent
        ).toBe(oldFileContents);
    });

    it('should handle unchanged files', async () => {
        expect.hasAssertions();

        const fileName = 'unchangedFile.txt';
        const newFileContents = 'same content';
        const oldFileContents = 'same content';
        const fullPath = '/mock/path/unchangedFile.txt';
        const changes: FileChange[] = [];

        const result = await processFileChange(
            fileName,
            newFileContents,
            oldFileContents,
            fullPath,
            changes
        );

        expect(result).toHaveLength(0);
    });
});
