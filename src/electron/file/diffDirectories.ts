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

import {
    diffTexts,
    DirectoryContents,
    FileChange,
    FileDiff,
    isBinaryFile,
    LineChangeGroup,
} from './getFileChangesToApplyMod';

const countLines = (str: string): number => {
    let count = 1; // Start with 1, as the last line may not end with '\n'
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '\n') {
            count++;
        }
    }
    return count;
};

export const diffDirectories = ({
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
}): FileChange[] => {
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

    for (const [k, v] of Object.entries(newDir)) {
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
            const subChanges = diffDirectories({
                oldDir: oldDir[fileName] as DirectoryContents,
                newDir: newDir[fileName] as DirectoryContents,
                parentPath: fullPath,
            });
            changes.push(...subChanges);
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
            continue;
        }

        if (existsInOldDir && !existsInNewDir && oldIsFile) {
            // This is a file that is being removed
            let changeGroup: LineChangeGroup = {
                startLineNumber: 0,
                endLineNumber: countLines(oldFileContents),
                changeType: 'remove',
                oldContent: oldFileContents,
            };
            changes.push({
                fileName: fullPath,
                lineChangeGroups: [changeGroup],
                isBinary: isBinaryFile(fileName),
            });
            continue;
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
            continue;
        }

        if (existsInOldDir && existsInNewDir && newIsFile && oldIsFile) {
            const diffs = diffTexts(oldFileContents, newFileContents);

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

            continue;
        }
    }

    if (ignoreRemovedFiles) return changes;

    for (const fileName of oldDirFileNames) {
        const oldFileContents = oldDir[fileName];
        const oldIsFile = typeof oldFileContents === 'string';
        const fullPath = parentPath ? `${parentPath}/${fileName}` : fileName;

        if (oldIsFile) {
            // This is a file that is being removed
            let changeGroup: LineChangeGroup = {
                startLineNumber: 0,
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
    }

    return changes;
};
