import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'node:fs';
import path from 'node:path';
import * as diff from 'diff';
import { diffLines, Change } from 'diff';
import { diffDirectories } from './diffDirectories';

// Define the type for the nested object structure
export type DirectoryContents = {
    [key: string]: string | DirectoryContents;
};

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
 * Recursively reads the contents of a directory and returns an object representing the directory structure.
 *
 * @param dirPath - The path to the directory to read.
 * @returns An object representing the directory structure, where keys are directory or file names and values are either nested directory contents or file contents.
 */
export const readDirectory = (dirPath: string): DirectoryContents => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result: DirectoryContents = {};

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            result[entry.name] = readDirectory(fullPath);
        } else {
            const fileContents = fs.readFileSync(fullPath, 'utf-8');
            result[entry.name] = fileContents;
        }
    }

    return result;
};

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

const SPECIAL_FILE_EXTENSIONS: string[] = [
    '.tga',
    '.til',
    '.pdf',
    '.spr',
    '.zfs',
    '.tif',
    '.db',
    '.ico',
    '.c2g',
    '.scc',
    '.htm',
    '.html',
    '.rtf',
    '.jpg',
    '.gif',
    '.dll',
    '.ogg',
    '.exe',
];

/**
 * Checks if the given file path has a special file extension (.tga, .til, .pdf, etc.).
 *
 * @param filePath - The path of the file to check.
 * @returns `true` if the file has a special extension, otherwise `false`.
 */
export const isBinaryFile = (filePath: string): boolean => {
    const lowerCasePath = filePath.toLowerCase();
    return SPECIAL_FILE_EXTENSIONS.some((ext) => lowerCasePath.endsWith(ext));
};

export type FileDiff = {
    fileName: string;
    changeDiffs: diff.Change[];
};

async function compareDirectories(
    oldDir: DirectoryContents,
    newDir: DirectoryContents
): Promise<FileChange[]> {
    return diffDirectories({ oldDir, newDir, ignoreRemovedFiles: true });
}

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
        const result = await compareDirectories(
            gameDirStructure,
            modDirStructure
        );

        // Now we have the comparison ready, we need to apply the changes to the game directory
        // Before we do that, we need to save the changes we will do to a file so that we can go backwards later to un-apply the changes

        console.log('result:', result);
    }
};
