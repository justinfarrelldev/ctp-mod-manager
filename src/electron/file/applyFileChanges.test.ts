import { describe, it, expect } from 'vitest';
import { areFileChangesValid, applyFileChanges } from './applyFileChanges';
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

        expect(areFileChangesValid({ modFileChanges })).toBe(false);
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
});
