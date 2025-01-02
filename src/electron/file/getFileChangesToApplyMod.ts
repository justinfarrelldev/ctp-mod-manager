import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'node:fs';
import path from 'node:path';
import * as diff from 'diff';
import { diffLines, Change } from 'diff';
import { diffDirectories } from './diffDirectories';
import { DirectoryContents, readDirectory } from './readDirectory';

export type LineChangeGroupAdd = {
    startLineNumber: number;
    endLineNumber: number;
    newContent: string;
    changeType: 'add';
};

export type LineChangeGroupRemove = {
    startLineNumber: number;
    endLineNumber: number;
    oldContent: string;
    changeType: 'remove';
};

export type LineChangeGroupReplace = {
    startLineNumber: number;
    endLineNumber: number;
    newContent: string;
    oldContent: string;
    changeType: 'replace';
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
export type LineChangeGroup =
    | LineChangeGroupAdd
    | LineChangeGroupRemove
    | LineChangeGroupReplace;

export type TextFileChange = {
    fileName: string;
    lineChangeGroups: LineChangeGroup[];
    isBinary?: false;
};

export type BinaryFileChange = {
    fileName: string;
    isBinary: true;
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
export type FileChange = TextFileChange | BinaryFileChange;

/**
 * Computes the differences between two texts using the Diff Match Patch library.
 *
 * @param text1 - The first text to compare.
 * @param text2 - The second text to compare.
 * @returns An array of differences, where each difference is represented as an
 *          object with a `0` (equal), `-1` (delete), or `1` (insert) operation
 *          and the associated text.
 */
export const diffTexts = (text1: string, text2: string): Change[] => {
    const diffs = diffLines(text1, text2, {
        newlineIsToken: true,
    });

    return diffs;
};

export type FileDiff = {
    fileName: string;
    changeDiffs: diff.Change[];
};

export const getFileChangesToApplyMod = async (
    mod: string,
    installDir: string
): Promise<FileChange[]> => {
    let statsOfFile: fs.Stats | undefined;
    try {
        statsOfFile = fs.statSync(`${DEFAULT_MOD_DIR}\\${mod}`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the file ${`${DEFAULT_MOD_DIR}\\${mod}`}: ${err}`
        );
    }

    if (statsOfFile) {
        if (!statsOfFile.isDirectory()) {
            console.error(
                `Error: ${`${DEFAULT_MOD_DIR}\\${mod}`} is not a directory.`
            );
            return;
        }

        const modDirStructure = readDirectory(`${DEFAULT_MOD_DIR}\\${mod}`);

        const gameDirStructure = readDirectory(installDir);

        /*
            This compares the game's structure to the mod's structure. To extrapolate this into other
            mods, we need to compare the other mods to the game's structure as well and then use the line 
            changes to deduce incompatible files. This can be done with as many mods as we like...
        */
        const result = diffDirectories({
            oldDir: gameDirStructure,
            newDir: modDirStructure,
        });

        // Now we have the comparison ready, we need to apply the changes to the game directory
        // Before we do that, we need to save the changes we will do to a file so that we can go backwards later to un-apply the changes

        console.log('result:', result);
    }
};
