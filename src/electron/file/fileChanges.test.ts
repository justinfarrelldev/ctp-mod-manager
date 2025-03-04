import * as fs from 'fs';
import { describe, expect, it, vi } from 'vitest';

import { addLinesToFile, removeLinesFromFile } from './applyFileChanges';
import { LineChangeGroupAdd, LineChangeGroupRemove } from './lineChangeGroup';

vi.mock('fs');

describe('addLinesToFile', () => {
    it('should add lines at the specified line numbers', () => {
        expect.hasAssertions();
        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 4,
            newContent: 'new line 1\nnew line 2',
            startLineNumber: 3,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>();
        const installDir = 'C:\\fakeInstallDir';

        const { lines: newLines } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(newLines).toStrictEqual([
            'line 1',
            'line 2',
            'new line 1',
            'new line 2',
            'line 3',
            'line 4',
        ]);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            newLines.join('\n'),
            'utf-8'
        );
    });

    vi.mock('fs');

    it('should add lines to the end of the file if endLineNumber is greater than file length', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 12,
            newContent: 'new line 1\nnew line 2\nnew line 3',
            startLineNumber: 10,
        };
        const lines = ['line 1', 'line 2', 'line 3'];
        const lineMap = new Map<number, number>();
        const installDir = 'C:\\fakeInstallDir';

        const { lines: newLines } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(newLines).toStrictEqual([
            'line 1',
            'line 2',
            'line 3',
            'new line 1',
            'new line 2',
            'new line 3',
        ]);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            newLines.join('\n'),
            'utf-8'
        );
    });

    it('should update the lineMap correctly', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 3,
            newContent: 'new line 1\nnew line 2',
            startLineNumber: 2,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        const { lineMap: newLineMap, lines: newLines } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(newLineMap).toStrictEqual(
            new Map<number, number>([
                [0, 0],
                [1, 3],
                [2, 4],
                [3, 5],
            ])
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            newLines.join('\n'),
            'utf-8'
        );
    });

    it('should correctly update the lineMap when adding lines at the beginning of the file', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 1,
            newContent: 'new line 1\nnew line 2',
            startLineNumber: 1,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        const { lineMap: newLineMap, lines: newLines } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(newLineMap).toStrictEqual(
            new Map<number, number>([
                [0, 2],
                [1, 3],
                [2, 4],
                [3, 5],
            ])
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            newLines.join('\n'),
            'utf-8'
        );
    });

    it('should correctly update the lineMap when adding lines in the middle of the file', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 3,
            newContent: 'new line 1\nnew line 2',
            startLineNumber: 3,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        const { lineMap: newLineMap, lines: newLines } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(newLineMap).toStrictEqual(
            new Map<number, number>([
                [0, 0],
                [1, 1],
                [2, 4],
                [3, 5],
            ])
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            newLines.join('\n'),
            'utf-8'
        );
    });
    it('should correctly apply multiple add changes and update the lineMap', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        // Using 1-based indexing: the insertion point to insert after line 2 is 3
        const lineChangeGroup1: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 3,
            newContent: 'new line 1',
            startLineNumber: 3,
        };
        // For the second change, to insert between line 3 and 4 in the new file,
        // we set startLineNumber to 5 (after the first insertion, line 4 becomes line 4)
        const lineChangeGroup2: LineChangeGroupAdd = {
            changeType: 'add',
            endLineNumber: 6,
            newContent: 'new line 2\nnew line 3',
            startLineNumber: 5,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        // Create a 1-based map: key and value both start at 1
        const lineMap = new Map<number, number>([
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        const { lineMap: newLineMap, lines: newLines } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup: lineChangeGroup1,
            lineMap,
            lines,
        });
        const { lineMap: newLineMap2, lines: newLines2 } = addLinesToFile({
            fileName,
            installDir,
            lineChangeGroup: lineChangeGroup2,
            lineMap: newLineMap,
            lines: newLines,
        });

        expect(newLines2).toStrictEqual([
            'line 1',
            'line 2',
            'new line 1',
            'line 3',
            'new line 2',
            'new line 3',
            'line 4',
        ]);
        expect(newLineMap2).toStrictEqual(
            new Map<number, number>([
                [1, 1],
                [2, 3],
                [3, 6],
                [4, 7],
            ])
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            newLines2.join('\n'),
            'utf-8'
        );
    });
});
vi.mock('fs');

describe('removeLinesFromFile', () => {
    it('should remove lines at the specified line numbers', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 3,
            oldContent: 'line 2\nline 3',
            startLineNumber: 2,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        removeLinesFromFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(lines).toStrictEqual(['line 1', 'line 4']);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            lines.join('\n'),
            'utf-8'
        );
    });

    it('should throw an error if endLineNumber exceeds file length', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 5,
            oldContent: 'line 3',
            startLineNumber: 3,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        expect(() => {
            removeLinesFromFile({
                fileName,
                installDir,
                lineChangeGroup,
                lineMap,
                lines,
            });
        }).toThrow(
            `endLineNumber (${lineChangeGroup.endLineNumber}) does not exist in the lineMap`
        );
    });

    it('should update the lineMap correctly after removing lines', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 3,
            oldContent: 'line 3\nline 4',
            startLineNumber: 2,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        removeLinesFromFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(lineMap).toStrictEqual(
            new Map<number, number>([
                [0, 0],
                [3, 1],
            ])
        );
    });

    it('should correctly update the lineMap when removing lines from the beginning of the file', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 2,
            oldContent: 'line 1\nline 2',
            startLineNumber: 1,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        removeLinesFromFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(lineMap).toStrictEqual(
            new Map<number, number>([
                [2, 0],
                [3, 1],
            ])
        );
    });

    it('should correctly update the lineMap when removing lines from the middle of the file', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 3,
            oldContent: 'line 4',
            startLineNumber: 3,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        removeLinesFromFile({
            fileName,
            installDir,
            lineChangeGroup,
            lineMap,
            lines,
        });

        expect(lineMap).toStrictEqual(
            new Map<number, number>([
                [0, 0],
                [1, 1],
                [3, 2],
            ])
        );
    });

    it('should correctly apply multiple remove changes and update the lineMap', () => {
        expect.hasAssertions();

        const fileName = 'testFile.txt';
        const lineChangeGroup1: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 1,
            oldContent: 'line 1',
            startLineNumber: 1,
        };
        const lineChangeGroup2: LineChangeGroupRemove = {
            changeType: 'remove',
            endLineNumber: 3,
            oldContent: 'line 3\nline 4',
            startLineNumber: 2,
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4', 'line 5'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
        const installDir = 'C:\\fakeInstallDir';

        removeLinesFromFile({
            fileName,
            installDir,
            lineChangeGroup: lineChangeGroup1,
            lineMap,
            lines,
        });
        removeLinesFromFile({
            fileName,
            installDir,
            lineChangeGroup: lineChangeGroup2,
            lineMap,
            lines,
        });

        expect(lines).toStrictEqual(['line 2', 'line 5']);
        expect(lineMap).toStrictEqual(
            new Map<number, number>([
                [1, 0],
                [4, 1],
            ])
        );
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            `${installDir}\\${fileName}`,
            lines.join('\n'),
            'utf-8'
        );
    });
});
