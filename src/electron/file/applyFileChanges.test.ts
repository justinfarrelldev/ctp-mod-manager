import { describe, expect, it } from 'vitest';

import {
    applyFileChanges,
    areFileChangesValid,
    textFileChangesAreConflicting,
} from './applyFileChanges';
import { FileChange, TextFileChange } from './fileChange';
import { LineChangeGroup } from './lineChangeGroup';
import { ModApplicationError } from './modApplicationError';
import { ModsIncompatibleError } from './modsIncompatibleError';

describe('areFileChangesValid', () => {
    it('should return true for non-overlapping changes', () => {
        expect.hasAssertions();
        const changeGroup: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'new content',
                startLineNumber: 1,
            },
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 3,
            },
        ];

        const fileChanges: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges,
                mod: 'mod1',
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBeTruthy();
    });
    it('should return false for overlapping changes', () => {
        expect.hasAssertions();

        const changeGroup1: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 3,
                newContent: 'new content',
                startLineNumber: 1,
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 2,
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup1,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup2,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges1,
                mod: 'mod1',
            },
            {
                fileChanges: fileChanges2,
                mod: 'mod2',
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBeFalsy();
    });

    it('should throw ModApplicationError for conflicts within a single mod', () => {
        expect.hasAssertions();

        const changeGroup: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 3,
                newContent: 'new content',
                startLineNumber: 1,
            },
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 2,
            },
        ];

        const fileChanges: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges,
                mod: 'mod1',
            },
        ];

        expect(() => areFileChangesValid({ modFileChanges })).toThrow(
            ModApplicationError
        );
    });

    it('should return true for non-overlapping changes across multiple mods', () => {
        expect.hasAssertions();

        const changeGroup1: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'new content',
                startLineNumber: 1,
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 3,
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup1,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup2,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges1,
                mod: 'mod1',
            },
            {
                fileChanges: fileChanges2,
                mod: 'mod2',
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBeTruthy();
    });

    it('should return false for overlapping changes across multiple mods', () => {
        expect.hasAssertions();

        const changeGroup1: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 3,
                newContent: 'new content',
                startLineNumber: 1,
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 2,
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup1,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup2,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges1,
                mod: 'mod1',
            },
            {
                fileChanges: fileChanges2,
                mod: 'mod2',
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBeFalsy();
    });

    it('should return false for overlapping changes across multiple mods and multiple files', () => {
        expect.hasAssertions();

        const changeGroup1: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 3,
                newContent: 'new content 1',
                startLineNumber: 1,
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content 2',
                startLineNumber: 2,
            },
        ];

        const changeGroup3: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 6,
                newContent: 'new content 3',
                startLineNumber: 5,
            },
        ];

        const changeGroup4: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'new content 4',
                startLineNumber: 1,
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup1,
            },
            {
                fileName: 'file2.txt',
                isBinary: false,
                lineChangeGroups: changeGroup3,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup2,
            },
        ];

        const fileChanges3: FileChange[] = [
            {
                fileName: 'file3.txt',
                isBinary: false,
                lineChangeGroups: changeGroup4,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges1,
                mod: 'mod1',
            },
            {
                fileChanges: fileChanges2,
                mod: 'mod2',
            },
            {
                fileChanges: fileChanges3,
                mod: 'mod3',
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBeFalsy();
    });
});
describe('applyFileChanges', () => {
    it('should throw ModsIncompatibleError when mod file changes are invalid', () => {
        expect.hasAssertions();

        const changeGroup1: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 3,
                newContent: 'new content',
                startLineNumber: 1,
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 2,
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup1,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup2,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges1,
                mod: 'mod1',
            },
            {
                fileChanges: fileChanges2,
                mod: 'mod2',
            },
        ];

        const installDir = 'C:\\fakeInstallDir';

        expect(() => applyFileChanges({ installDir, modFileChanges })).toThrow(
            ModsIncompatibleError
        );
    });
    describe('textFileChangesAreConflicting', () => {
        it('should return false for non-overlapping changes', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 2,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                        {
                            changeType: 'remove',
                            endLineNumber: 4,
                            oldContent: 'old content',
                            startLineNumber: 3,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeFalsy();
        });

        it('should return true for overlapping changes within the same file', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 3,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                        {
                            changeType: 'remove',
                            endLineNumber: 4,
                            oldContent: 'old content',
                            startLineNumber: 2,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeTruthy();
        });

        it('should return false for changes in different files', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 2,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                    ],
                },
                {
                    fileName: 'file2.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'remove',
                            endLineNumber: 2,
                            oldContent: 'old content',
                            startLineNumber: 1,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeFalsy();
        });

        it('should return true for overlapping changes across multiple files', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 3,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                    ],
                },
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'remove',
                            endLineNumber: 4,
                            oldContent: 'old content',
                            startLineNumber: 2,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeTruthy();
        });

        it('should return false for adjacent changes', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 2,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                        {
                            changeType: 'remove',
                            endLineNumber: 4,
                            oldContent: 'old content',
                            startLineNumber: 3,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeFalsy();
        });

        it('should return true for changes that start and end on the same line', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 2,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                        {
                            changeType: 'remove',
                            endLineNumber: 3,
                            oldContent: 'old content',
                            startLineNumber: 2,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeTruthy();
        });

        it('should return false for empty file changes', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [];

            expect(textFileChangesAreConflicting(fileChanges)).toBeFalsy();
        });

        it('should return false for non-overlapping changes with large gaps', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 2,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                        {
                            changeType: 'remove',
                            endLineNumber: 101,
                            oldContent: 'old content',
                            startLineNumber: 100,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeFalsy();
        });

        it('should return true for overlapping changes with large gaps', () => {
            expect.hasAssertions();

            const fileChanges: TextFileChange[] = [
                {
                    fileName: 'file1.txt',
                    lineChangeGroups: [
                        {
                            changeType: 'add',
                            endLineNumber: 100,
                            newContent: 'new content',
                            startLineNumber: 1,
                        },
                        {
                            changeType: 'remove',
                            endLineNumber: 150,
                            oldContent: 'old content',
                            startLineNumber: 50,
                        },
                    ],
                },
            ];

            expect(textFileChangesAreConflicting(fileChanges)).toBeTruthy();
        });
    });
    it.skip('should not throw when mod file changes are valid', () => {
        expect.hasAssertions();

        const changeGroup1: LineChangeGroup[] = [
            {
                changeType: 'add',
                endLineNumber: 2,
                newContent: 'new content',
                startLineNumber: 1,
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                changeType: 'remove',
                endLineNumber: 4,
                oldContent: 'old content',
                startLineNumber: 3,
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup1,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                isBinary: false,
                lineChangeGroups: changeGroup2,
            },
        ];

        const modFileChanges = [
            {
                fileChanges: fileChanges1,
                mod: 'mod1',
            },
            {
                fileChanges: fileChanges2,
                mod: 'mod2',
            },
        ];

        const installDir = 'C:\\fakeInstallDir';

        expect(() =>
            applyFileChanges({ installDir, modFileChanges })
        ).not.toThrow();
    });
});
