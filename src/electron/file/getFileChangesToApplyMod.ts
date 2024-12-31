import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'node:fs';
import path from 'node:path';
import * as diff from 'diff';
import diff_match_patch from 'diff-match-patch';

// Define the type for the nested object structure
type DirectoryContents = {
    [key: string]: string | DirectoryContents;
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
type LineChangeGroup = {
    startLineNumber: number;
    endLineNumber: number;
    change: string; // The change, including everything between startLineNumber and endLineNumber (including newlines)
    contentBeforeChange: string; // The content before it was replaced by the mod
    changeType: 'add' | 'remove' | 'replace';
};

// Wish there was a way to share this type, but alas... it's also found in App.tsx
type FileChange =
    | {
          fileName: string;
          lineChangeGroups: LineChangeGroup[];
          isBinary?: false;
      }
    | {
          fileName: string;
          isBinary: true;
      };

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

// FIXME this solution is async and makes use of p-limit, but it's too slow at reading the game dir. A stutter is better than 5 mins of waiting
// async function readDirectory(dirPath: string): Promise<DirectoryContents> {
//     const entries = await readdirPromisified(dirPath, { withFileTypes: true });
//     const result: DirectoryContents = {};

//     await Promise.all(
//         entries.map((entry) =>
//             limit(async () => {
//                 const fullPath = path.join(dirPath, entry.name);
//                 if (entry.isDirectory()) {
//                     result[entry.name] = await readDirectory(fullPath);
//                 } else {
//                     result[entry.name] = await readfilePromisified(fullPath);
//                 }
//             })
//         )
//     );

//     return result;
// }

/**
 * Computes the differences between two texts using the Diff Match Patch library.
 *
 * @param text1 - The first text to compare.
 * @param text2 - The second text to compare.
 * @returns An array of differences, where each difference is represented as an
 *          object with a `0` (equal), `-1` (delete), or `1` (insert) operation
 *          and the associated text.
 */
export const diffTexts = (
    text1: string,
    text2: string
): diff_match_patch.Diff[] => {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(text1, text2);
    dmp.diff_cleanupSemantic(diffs);
    return diffs;
};

const getFileChanges = (fileDiff: FileDiff): FileChange => {
    const lineChangeGroups: LineChangeGroup[] = [];

    let oldLineNumber = 1;
    let newLineNumber = 1;

    for (const diffPart of fileDiff.changeDiffs) {
        const length = diffPart.count;
        if (diffPart.added) {
            lineChangeGroups.push({
                startLineNumber: newLineNumber,
                endLineNumber: newLineNumber + length - 1,
                change: diffPart.value,
                contentBeforeChange: '',
                changeType: 'add',
            });
            newLineNumber += length;
        } else if (diffPart.removed) {
            lineChangeGroups.push({
                startLineNumber: oldLineNumber,
                endLineNumber: oldLineNumber + length - 1,
                change: '',
                contentBeforeChange: diffPart.value,
                changeType: 'remove',
            });
            oldLineNumber += length;
        } else {
            oldLineNumber += length;
            newLineNumber += length;
        }
    }

    return {
        fileName: fileDiff.fileName,
        lineChangeGroups,
    };
};

/**
 * Processes the differences between two directory contents and generates a list of file changes to apply a mod.
 *
 * @param oldContent - The original directory contents.
 * @param newContent - The new directory contents to compare against the original.
 * @param prefix - An optional prefix to prepend to file paths.
 * @returns A promise that resolves to an array of file changes.
 */
export const processDirectory = async (
    oldContent: DirectoryContents,
    newContent: DirectoryContents,
    prefix: string = ''
): Promise<FileChange[]> => {
    let changes: FileChange[] = [];
    let stack: {
        oldContent: DirectoryContents;
        newContent: DirectoryContents;
        prefix: string;
    }[] = [];
    let fileDiffPromises: Promise<FileDiff>[] = [];

    // Start with the initial directory
    stack.push({ oldContent, newContent, prefix });

    while (stack.length > 0) {
        const { oldContent, newContent, prefix } = stack.pop()!;

        processDirectoryEntries(
            oldContent,
            newContent,
            prefix,
            stack,
            fileDiffPromises,
            changes
        );
    }

    // Wait for all file diffs to be resolved
    const fileDiffs = await Promise.all(fileDiffPromises);

    // Convert file diffs to file changes
    for (const diff of fileDiffs) {
        changes.push(getFileChanges(diff));
    }

    return changes;
};

/**
 * Processes new content and updates the stack and changes arrays accordingly.
 *
 * @param params - The parameters for processing new content.
 * @param params.newContent - The new directory contents to process.
 * @param params.prefix - The prefix path for the current directory.
 * @param params.stack - The stack used to keep track of directory contents and their prefixes.
 * @param params.changes - The array to store file changes.
 */
export const processNewContent = ({
    newContent,
    prefix,
    stack,
    changes,
}: {
    newContent: DirectoryContents;
    prefix: string;
    stack: {
        oldContent: DirectoryContents;
        newContent: DirectoryContents;
        prefix: string;
    }[];
    changes: FileChange[];
}) => {
    for (const key of Object.keys(newContent)) {
        const newFilePath = newContent[key];
        const fullPath = prefix + key;

        if (typeof newFilePath === 'object') {
            stack.push({
                oldContent: {},
                newContent: newFilePath,
                prefix: fullPath + '/',
            });
        } else if (typeof newFilePath === 'string') {
            changes.push({
                fileName: fullPath,
                lineChangeGroups: [
                    {
                        startLineNumber: 1,
                        endLineNumber: newFilePath.split('\n').length,
                        change: newFilePath,
                        contentBeforeChange: '',
                        changeType: 'add',
                    },
                ],
            });
        }
    }
};

/**
 * Processes directory entries by comparing the old and new directory contents.
 * If both entries are directories, they are pushed to the stack for further processing.
 * If both entries are files, the file entries are processed to determine the differences.
 *
 * @param oldContent - The contents of the old directory.
 * @param newContent - The contents of the new directory.
 * @param prefix - The prefix path to be used for the current directory.
 * @param stack - A stack used to store directories that need further processing.
 * @param fileDiffPromises - An array of promises that resolve to file differences.
 * @param changes - An array to store the changes detected between the old and new directory contents.
 */
const processDirectoryEntries = (
    oldContent: DirectoryContents,
    newContent: DirectoryContents,
    prefix: string,
    stack: {
        oldContent: DirectoryContents;
        newContent: DirectoryContents;
        prefix: string;
    }[],
    fileDiffPromises: Promise<FileDiff>[],
    changes: FileChange[]
): void => {
    if (
        Object.keys(oldContent).length === 0 &&
        Object.keys(newContent).length > 0
    ) {
        processNewContent({ newContent, prefix, stack, changes });
        return;
    }

    if (
        Object.keys(newContent).length === 0 &&
        Object.keys(oldContent).length > 0
    ) {
        for (const key of Object.keys(oldContent)) {
            const oldFilePath = oldContent[key];
            const fullPath = prefix + key;

            if (typeof oldFilePath === 'object') {
                stack.push({
                    oldContent: oldFilePath,
                    newContent: {},
                    prefix: fullPath + '/',
                });
            } else if (typeof oldFilePath === 'string') {
                changes.push({
                    fileName: fullPath,
                    lineChangeGroups: [
                        {
                            startLineNumber: 1,
                            endLineNumber: oldFilePath.split('\n').length,
                            change: '',
                            contentBeforeChange: oldFilePath,
                            changeType: 'remove',
                        },
                    ],
                });
            }
        }
        return;
    }

    for (const key of Object.keys(newContent)) {
        const oldFilePath = Object.keys(oldContent)[0];
        const fullPath = prefix + key;
        if (typeof key === 'object' && typeof oldFilePath === 'object') {
            // If both are directories, push to stack to process later
            stack.push({
                oldContent: oldFilePath,
                newContent: key,
                prefix: fullPath + '/',
            });
        } else if (typeof key === 'string' && typeof oldFilePath === 'string') {
            processFileEntries(
                oldFilePath,
                key,
                fullPath,
                fileDiffPromises,
                changes
            );
        }
    }
};

const SPECIAL_FILE_EXTENSIONS: string[] = ['.tga', '.til', '.pdf'];
const MAX_LINE_COUNT: number = 400;

/**
 * Checks if the given file path has a special file extension (.tga, .til, .pdf, etc.).
 *
 * @param filePath - The path of the file to check.
 * @returns `true` if the file has a special extension, otherwise `false`.
 */
const isSpecialFile = (filePath: string): boolean =>
    SPECIAL_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext));

/**
 * Processes file entries to determine changes between old and new file versions.
 *
 * @param oldFilePath - The path to the old file version.
 * @param newFilePath - The path to the new file version.
 * @param fullPath - The full path of the file being processed.
 * @param fileDiffPromises - An array to store promises that resolve to file differences.
 * @param changes - An array to store file changes.
 *
 * @returns void
 *
 * This function compares the old and new file versions to determine if there are any changes.
 * If both files are binary and their sizes differ, it records the change.
 * If the files are text and their contents differ, it creates a promise to compute the differences
 * and adds it to the fileDiffPromises array.
 * If the new file content exceeds a maximum line count, it uses a different method to compute the differences.
 */
export const processFileEntries = (
    oldFilePath: string,
    newFilePath: string,
    fullPath: string,
    fileDiffPromises: Promise<FileDiff>[],
    changes: FileChange[]
): void => {
    if (isSpecialFile(newFilePath) && isSpecialFile(oldFilePath)) {
        const oldFileStats = fs.statSync(oldFilePath);
        const newFileStats = fs.statSync(newFilePath);

        if (oldFileStats.size !== newFileStats.size) {
            changes.push({
                fileName: fullPath,
                isBinary: true,
            });
        }
        return;
    }

    const oldFileContent = fs.readFileSync(oldFilePath, 'utf-8');
    const newFileContent = fs.readFileSync(newFilePath, 'utf-8');

    if (oldFileContent === newFileContent) {
        // These are the same
        return;
    } else if (newFileContent.split('\n').length > MAX_LINE_COUNT) {
        const diffs = diffTexts(oldFileContent, newFileContent);
        fileDiffPromises.push(
            new Promise((resolve) => {
                const converted = diffs.map((dmpDiff) => ({
                    count: diffs.length,
                    value: dmpDiff[1],
                }));
                resolve({
                    fileName: fullPath,
                    changeDiffs: [...converted],
                });
            })
        );
    } else {
        // If both are files, push to promise list to resolve later
        fileDiffPromises.push(
            new Promise<FileDiff>((resolve) => {
                getFileDiff(
                    oldFileContent,
                    newFileContent,
                    fullPath,
                    (value) => {
                        resolve({
                            fileName: fullPath,
                            changeDiffs: value,
                        });
                    }
                );
            })
        );
    }
};

type FileDiff = {
    fileName: string;
    changeDiffs: diff.Change[];
};

const getFileDiff = (
    oldContent: string,
    newContent: string,
    fileName: string,
    onValueGotten: (changes: diff.Change[]) => any
): void => {
    diff.diffLines(oldContent, newContent, (err, value) => {
        if (err) {
            console.error(
                `An error occurred while diffing the file ${fileName}: ${err}`
            );
        }
        onValueGotten(value);
    });
};

async function compareDirectories(
    oldDir: DirectoryContents,
    newDir: DirectoryContents
): Promise<FileChange[]> {
    return processDirectory(oldDir, newDir);
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
        compareDirectories(gameDirStructure, modDirStructure).then(
            (fileChanges) => {
                console.log('file changes: ', JSON.stringify(fileChanges));
            }
        );
    }
};
