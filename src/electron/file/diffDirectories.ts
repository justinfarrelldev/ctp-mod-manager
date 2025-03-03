/*
    # Plan

    Goal: Need to have the new directory diffed against the old one and gather the differences then return them as a FileChange[].

    The assumption is that the top-level of both of these is the same - we need to ensure this with a check before calling this function
    in the first place (since this function will consume DirectoryContents, and that does not have info about the parent directory).
    
    To reverse them, we can just provide the new directory as the old one and the old one as the new one.

    To do this, we need:

    - A list of all relative paths of every file in the new and old directories, along with their file data (maybe two sets)?
        - This was already done by readDirectory

    - To compare the two sets and find the differences, we can:
        - Iterate over the new set and:
            - If the file is not in the old set, it is a new file (and we set it as a big "add" FileChange)
            - If the file is in the old set, compare the file data and if it is different, we find the changes
            - If the file is in the old set but not in the new set, it is a deleted file (and set it as a big "remove" FileChange)

    - Return the FileChange[]
*/

import { FileChange } from './fileChange';
import { diffTexts } from './getFileChangesToApplyMod';
import { isBinaryFile } from './isBinaryFile';
import { LineChangeGroup } from './lineChangeGroup';
import { DirectoryContents } from './readDirectory';
import * as crypto from 'crypto';

export const countLines = (str: string): number => {
    // We rely on '\n' having char code 10
    let newlineCount = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) === 10) {
            newlineCount++;
        }
    }

    // Start from 1 line, then add the newlines
    let total = newlineCount + 1;

    // If the last character is a newline, don't count an extra line
    if (str.length > 0 && str.charCodeAt(str.length - 1) === 10) {
        total--;
    }

    return total;
};

const hashFileContents = (contents: string): string => {
    return crypto.createHash('sha256').update(contents).digest('hex');
};

export const diffDirectories = async ({
    oldDir,
    newDir,
    parentPath,
    ignoreRemovedFiles = false,
}: {
    oldDir: DirectoryContents;
    newDir: DirectoryContents;
    parentPath?: string;
    ignoreRemovedFiles?: boolean; // This is for the case where we don't want to include removed files (because the "new" dir is the mod, and the old one
    // is the game data)
}): Promise<FileChange[]> => {
    if (oldDir === undefined) {
        oldDir = {};
    }

    if (newDir === undefined) {
        newDir = {};
    }

    const changes: FileChange[] = [];

    // Every time we see a file, we will remove it from this list
    // so that we can determine which files were deleted
    const oldDirFileNames: string[] = Object.keys(oldDir);

    const promises = Object.entries(newDir).map(async ([k, v]) => {
        oldDirFileNames.splice(oldDirFileNames.indexOf(k), 1);
        let fileName = k;
        const newFileContents = v;
        const oldFileContents = oldDir[fileName];
        const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;

        const oldIsFile = typeof oldFileContents === 'string';
        const newIsFile = typeof newFileContents === 'string';
        const existsInOldDir = oldDir[fileName] !== undefined;
        const existsInNewDir = newDir[fileName] !== undefined;

        if (!oldIsFile && !newIsFile) {
            // This is a directory, we want to recursively call this on it and append the results
            const subChanges = await diffDirectories({
                oldDir: oldDir[fileName] as DirectoryContents,
                newDir: newDir[fileName] as DirectoryContents,
                parentPath: fullPath,
            });
            changes.push(...subChanges);
            return;
        }

        if (!existsInOldDir && !existsInNewDir) {
            throw new Error(
                `File ${fileName} does not exist in either directory`
            );
        }

        if (
            (oldIsFile && !newIsFile && existsInOldDir && existsInNewDir) ||
            (newIsFile && !oldIsFile && existsInOldDir && existsInNewDir)
        ) {
            throw new Error(
                `File ${fileName} exists in one directory but not the other`
            );
        }

        if (!existsInOldDir && existsInNewDir && newIsFile) {
            // This is a file that is being added
            let changeGroup: LineChangeGroup = {
                startLineNumber: 1,
                endLineNumber: countLines(newFileContents),
                changeType: 'add',
                newContent: newFileContents,
            };
            changes.push({
                fileName: fullPath,
                lineChangeGroups: [changeGroup],
                isBinary: isBinaryFile(fileName),
            });
            return;
        }

        if (existsInOldDir && !existsInNewDir && oldIsFile) {
            // This is a file that is being left in, there is no change required
            // At first I made the assumption it is a file that is removed, however
            // upon further thinking - by virtue of not having a file there, it
            // should be assumed that the file is a main game file or
            // untouched file in another mod.
            // For example, if Age of Man did not have a file, but the "oldDir"
            // (or the base game) did, then of course AOM is not removing it!
            // So, we can safely skip these changes

            console.log(
                `Skipping file ${fullPath} as it exists in the old directory but not in the new directory`
            );

            return;
        }

        if (
            existsInOldDir &&
            existsInNewDir &&
            newIsFile &&
            oldIsFile &&
            isBinaryFile(fileName)
        ) {
            // This is a binary file that is being changed
            const changeGroup: LineChangeGroup = {
                startLineNumber: 1,
                endLineNumber: countLines(newFileContents),
                changeType: 'replace',
                newContent: newFileContents,
                oldContent: oldFileContents,
            };
            changes.push({
                fileName: fullPath,
                lineChangeGroups: [changeGroup],
                isBinary: isBinaryFile(fileName),
            });
            console.log(
                'added binary file to change list as a replace: ',
                fullPath
            );
            return;
        }

        if (existsInOldDir && existsInNewDir && newIsFile && oldIsFile) {
            const oldFileHash = hashFileContents(oldFileContents);
            const newFileHash = hashFileContents(newFileContents);

            if (oldFileHash === newFileHash) {
                // Files are the same, skip further processing
                return;
            }

            const diffs = await diffTexts(oldFileContents, newFileContents);

            console.log('diffs are: ', diffs);

            let lineCount = 1;

            for (const diff of diffs) {
                if (diff.added) {
                    const changeGroup: LineChangeGroup = {
                        startLineNumber: lineCount,
                        endLineNumber: lineCount,
                        changeType: 'add',
                        newContent: diff.value,
                    };
                    changes.push({
                        fileName: fullPath,
                        lineChangeGroups: [changeGroup],
                        isBinary: isBinaryFile(fileName),
                    });
                } else if (diff.removed) {
                    const changeGroup: LineChangeGroup = {
                        startLineNumber: lineCount,
                        endLineNumber: lineCount,
                        changeType: 'remove',
                        oldContent: diff.value,
                    };
                    changes.push({
                        fileName: fullPath,
                        lineChangeGroups: [changeGroup],
                        isBinary: isBinaryFile(fileName),
                    });
                } else {
                    // Do nothing here, this library handles replace as a remove then an add
                }
                if (diff.value.includes('\n')) {
                    lineCount++;
                }
            }

            return;
        }
    });

    await Promise.all(promises);

    if (ignoreRemovedFiles) return changes;

    const removedFilesPromises = oldDirFileNames.map(async (fileName) => {
        const oldFileContents = oldDir[fileName];
        const oldIsFile = typeof oldFileContents === 'string';
        const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;

        if (oldIsFile) {
            // This is a file that is being removed
            let changeGroup: LineChangeGroup = {
                startLineNumber: 1,
                endLineNumber: countLines(oldFileContents),
                changeType: 'remove',
                oldContent: oldFileContents,
            };
            changes.push({
                fileName: fullPath,
                lineChangeGroups: [changeGroup],
                isBinary: isBinaryFile(fileName),
            });
        }
    });

    await Promise.allSettled(removedFilesPromises);

    return changes;
};
