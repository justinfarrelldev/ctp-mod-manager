import { describe, it, expect, vi } from 'vitest';
import { addLinesToFile } from './applyFileChanges';
import * as fs from 'fs';
import { LineChangeGroupAdd } from './lineChangeGroup';

vi.mock('fs');

describe('addLinesToFile', () => {
    it('should add lines to the end of the file if endLineNumber is greater than file length', () => {
        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            startLineNumber: 10,
            endLineNumber: 12,
            newContent: 'new line 1\nnew line 2\nnew line 3',
            changeType: 'add',
        };
        const lines = ['line 1', 'line 2', 'line 3'];
        const lineMap = new Map<number, number>();

        addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

        expect(lines).toEqual([
            'line 1',
            'line 2',
            'line 3',
            'new line 1',
            'new line 2',
            'new line 3',
        ]);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            fileName,
            lines.join('\n'),
            'utf-8'
        );
    });

    it('should add lines at the specified line numbers', () => {
        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            startLineNumber: 2,
            endLineNumber: 3,
            newContent: 'new line 1\nnew line 2',
            changeType: 'add',
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>();

        addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

        expect(lines).toEqual([
            'line 1',
            'new line 1',
            'new line 2',
            'line 2',
            'line 3',
            'line 4',
        ]);
        expect(fs.writeFileSync).toHaveBeenCalledWith(
            fileName,
            lines.join('\n'),
            'utf-8'
        );
    });

    it('should update the lineMap correctly', () => {
        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            startLineNumber: 2,
            endLineNumber: 3,
            newContent: 'new line 1\nnew line 2',
            changeType: 'add',
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);

        addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

        expect(lineMap).toEqual(
            new Map<number, number>([
                [0, 0],
                [1, 3],
                [2, 4],
                [3, 5],
            ])
        );
    });

    it('should correctly update the lineMap when adding lines at the beginning of the file', () => {
        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            startLineNumber: 1,
            endLineNumber: 1,
            newContent: 'new line 1\nnew line 2',
            changeType: 'add',
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);

        addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

        expect(lineMap).toEqual(
            new Map<number, number>([
                [0, 2],
                [1, 3],
                [2, 4],
                [3, 5],
            ])
        );
    });

    it('should correctly update the lineMap when adding lines in the middle of the file', () => {
        const fileName = 'testFile.txt';
        const lineChangeGroup: LineChangeGroupAdd = {
            startLineNumber: 3,
            endLineNumber: 3,
            newContent: 'new line 1\nnew line 2',
            changeType: 'add',
        };
        const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
        const lineMap = new Map<number, number>([
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
        ]);

        addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

        expect(lineMap).toEqual(
            new Map<number, number>([
                [0, 0],
                [1, 1],
                [2, 4],
                [3, 5],
            ])
        );
    });

    vi.mock('fs');

    describe('addLinesToFile', () => {
        it('should add lines to the end of the file if endLineNumber is greater than file length', () => {
            const fileName = 'testFile.txt';
            const lineChangeGroup: LineChangeGroupAdd = {
                startLineNumber: 10,
                endLineNumber: 12,
                newContent: 'new line 1\nnew line 2\nnew line 3',
                changeType: 'add',
            };
            const lines = ['line 1', 'line 2', 'line 3'];
            const lineMap = new Map<number, number>();

            addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

            expect(lines).toEqual([
                'line 1',
                'line 2',
                'line 3',
                'new line 1',
                'new line 2',
                'new line 3',
            ]);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                fileName,
                lines.join('\n'),
                'utf-8'
            );
        });

        it('should add lines at the specified line numbers', () => {
            const fileName = 'testFile.txt';
            const lineChangeGroup: LineChangeGroupAdd = {
                startLineNumber: 2,
                endLineNumber: 3,
                newContent: 'new line 1\nnew line 2',
                changeType: 'add',
            };
            const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
            const lineMap = new Map<number, number>();

            addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

            expect(lines).toEqual([
                'line 1',
                'new line 1',
                'new line 2',
                'line 2',
                'line 3',
                'line 4',
            ]);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                fileName,
                lines.join('\n'),
                'utf-8'
            );
        });

        it('should update the lineMap correctly', () => {
            const fileName = 'testFile.txt';
            const lineChangeGroup: LineChangeGroupAdd = {
                startLineNumber: 2,
                endLineNumber: 3,
                newContent: 'new line 1\nnew line 2',
                changeType: 'add',
            };
            const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
            const lineMap = new Map<number, number>([
                [0, 0],
                [1, 1],
                [2, 2],
                [3, 3],
            ]);

            addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

            expect(lineMap).toEqual(
                new Map<number, number>([
                    [0, 0],
                    [1, 3],
                    [2, 4],
                    [3, 5],
                ])
            );
        });

        it('should correctly update the lineMap when adding lines at the beginning of the file', () => {
            const fileName = 'testFile.txt';
            const lineChangeGroup: LineChangeGroupAdd = {
                startLineNumber: 1,
                endLineNumber: 1,
                newContent: 'new line 1\nnew line 2',
                changeType: 'add',
            };
            const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
            const lineMap = new Map<number, number>([
                [0, 0],
                [1, 1],
                [2, 2],
                [3, 3],
            ]);

            addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

            expect(lineMap).toEqual(
                new Map<number, number>([
                    [0, 2],
                    [1, 3],
                    [2, 4],
                    [3, 5],
                ])
            );
        });

        it('should correctly update the lineMap when adding lines in the middle of the file', () => {
            const fileName = 'testFile.txt';
            const lineChangeGroup: LineChangeGroupAdd = {
                startLineNumber: 3,
                endLineNumber: 3,
                newContent: 'new line 1\nnew line 2',
                changeType: 'add',
            };
            const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
            const lineMap = new Map<number, number>([
                [0, 0],
                [1, 1],
                [2, 2],
                [3, 3],
            ]);

            addLinesToFile({ fileName, lineChangeGroup, lines, lineMap });

            expect(lineMap).toEqual(
                new Map<number, number>([
                    [0, 0],
                    [1, 1],
                    [2, 4],
                    [3, 5],
                ])
            );
        });

        it('should correctly apply multiple add changes and update the lineMap', () => {
            const fileName = 'testFile.txt';
            const lineChangeGroup1: LineChangeGroupAdd = {
                startLineNumber: 2,
                endLineNumber: 2,
                newContent: 'new line 1',
                changeType: 'add',
            };
            const lineChangeGroup2: LineChangeGroupAdd = {
                startLineNumber: 4,
                endLineNumber: 5,
                newContent: 'new line 2\nnew line 3',
                changeType: 'add',
            };
            const lines = ['line 1', 'line 2', 'line 3', 'line 4'];
            const lineMap = new Map<number, number>([
                [0, 0],
                [1, 1],
                [2, 2],
                [3, 3],
            ]);

            addLinesToFile({
                fileName,
                lineChangeGroup: lineChangeGroup1,
                lines,
                lineMap,
            });
            addLinesToFile({
                fileName,
                lineChangeGroup: lineChangeGroup2,
                lines,
                lineMap,
            });

            expect(lines).toEqual([
                'line 1',
                'new line 1',
                'line 2',
                'line 3',
                'new line 2',
                'new line 3',
                'line 4',
            ]);
            expect(lineMap).toEqual(
                new Map<number, number>([
                    [0, 0],
                    [1, 3],
                    [2, 4],
                    [3, 6],
                ])
            );
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                fileName,
                lines.join('\n'),
                'utf-8'
            );
        });
    });
});
