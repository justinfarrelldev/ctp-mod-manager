import { describe, it, expect } from 'vitest';
import {
    areFileChangesValid,
    applyFileChanges,
    ModApplicationError,
    ModsIncompatibleError,
} from './applyFileChanges';
import { FileChange } from './fileChange';
import { LineChangeGroup } from './lineChangeGroup';

describe('areFileChangesValid', () => {
    it('should return true for non-overlapping changes', () => {
        const changeGroup: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 2,
                newContent: 'new content',
                changeType: 'add',
            },
            {
                startLineNumber: 3,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges,
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBe(true);
    });
    it('should return false for overlapping changes', () => {
        const changeGroup1: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 3,
                newContent: 'new content',
                changeType: 'add',
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                startLineNumber: 2,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup1,
                isBinary: false,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup2,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges1,
            },
            {
                mod: 'mod2',
                fileChanges: fileChanges2,
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBe(false);
    });

    it('should throw ModApplicationError for conflicts within a single mod', () => {
        const changeGroup: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 3,
                newContent: 'new content',
                changeType: 'add',
            },
            {
                startLineNumber: 2,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges,
            },
        ];

        expect(() => areFileChangesValid({ modFileChanges })).toThrow(
            ModApplicationError
        );
    });

    it('should return true for non-overlapping changes across multiple mods', () => {
        const changeGroup1: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 2,
                newContent: 'new content',
                changeType: 'add',
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                startLineNumber: 3,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup1,
                isBinary: false,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup2,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges1,
            },
            {
                mod: 'mod2',
                fileChanges: fileChanges2,
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBe(true);
    });

    it('should return false for overlapping changes across multiple mods', () => {
        const changeGroup1: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 3,
                newContent: 'new content',
                changeType: 'add',
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                startLineNumber: 2,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup1,
                isBinary: false,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup2,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges1,
            },
            {
                mod: 'mod2',
                fileChanges: fileChanges2,
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBe(false);
    });

    it('should return false for overlapping changes across multiple mods and multiple files', () => {
        const changeGroup1: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 3,
                newContent: 'new content 1',
                changeType: 'add',
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                startLineNumber: 2,
                endLineNumber: 4,
                oldContent: 'old content 2',
                changeType: 'remove',
            },
        ];

        const changeGroup3: LineChangeGroup[] = [
            {
                startLineNumber: 5,
                endLineNumber: 6,
                newContent: 'new content 3',
                changeType: 'add',
            },
        ];

        const changeGroup4: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 2,
                newContent: 'new content 4',
                changeType: 'add',
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup1,
                isBinary: false,
            },
            {
                fileName: 'file2.txt',
                lineChangeGroups: changeGroup3,
                isBinary: false,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup2,
                isBinary: false,
            },
        ];

        const fileChanges3: FileChange[] = [
            {
                fileName: 'file3.txt',
                lineChangeGroups: changeGroup4,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges1,
            },
            {
                mod: 'mod2',
                fileChanges: fileChanges2,
            },
            {
                mod: 'mod3',
                fileChanges: fileChanges3,
            },
        ];

        expect(areFileChangesValid({ modFileChanges })).toBe(false);
    });
});
describe('applyFileChanges', () => {
    it('should throw ModsIncompatibleError when mod file changes are invalid', () => {
        const changeGroup1: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 3,
                newContent: 'new content',
                changeType: 'add',
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                startLineNumber: 2,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup1,
                isBinary: false,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup2,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges1,
            },
            {
                mod: 'mod2',
                fileChanges: fileChanges2,
            },
        ];

        const installDir = 'C:\\fakeInstallDir';

        expect(() => applyFileChanges({ modFileChanges, installDir })).toThrow(
            ModsIncompatibleError
        );
    });

    it.skip('should not throw when mod file changes are valid', () => {
        const changeGroup1: LineChangeGroup[] = [
            {
                startLineNumber: 1,
                endLineNumber: 2,
                newContent: 'new content',
                changeType: 'add',
            },
        ];

        const changeGroup2: LineChangeGroup[] = [
            {
                startLineNumber: 3,
                endLineNumber: 4,
                oldContent: 'old content',
                changeType: 'remove',
            },
        ];

        const fileChanges1: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup1,
                isBinary: false,
            },
        ];

        const fileChanges2: FileChange[] = [
            {
                fileName: 'file1.txt',
                lineChangeGroups: changeGroup2,
                isBinary: false,
            },
        ];

        const modFileChanges = [
            {
                mod: 'mod1',
                fileChanges: fileChanges1,
            },
            {
                mod: 'mod2',
                fileChanges: fileChanges2,
            },
        ];

        const installDir = 'C:\\fakeInstallDir';

        expect(() =>
            applyFileChanges({ modFileChanges, installDir })
        ).not.toThrow();
    });
});
