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

import * as crypto from 'crypto';
import pLimit from 'p-limit';
import { ReadonlyDeep } from 'type-fest';

import { FileChange } from './fileChange';
import { diffTexts } from './getFileChangesToApplyMod';
import { isBinaryFile } from './isBinaryFile';
import { LineChangeGroup } from './lineChangeGroup';
import { DirectoryContents } from './readDirectory';

const MAX_PROMISES_ALLOWED = 100;

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

const processFileChange = async (
    fileName: string,
    newFileContents: string,
    oldFileContents: string,
    fullPath: string,
    changes: ReadonlyDeep<FileChange[]>
): Promise<void> => {
    console.log(`Processing file change for: ${fileName}`);
    const oldIsFile = typeof oldFileContents === 'string';
    const newIsFile = typeof newFileContents === 'string';

    if (!oldIsFile && !newIsFile) {
        // This is a directory, we want to recursively call this on it and append the results
        console.log(`Directory detected: ${fullPath}`);
        const subChanges = await diffDirectories({
            newDir: newFileContents as DirectoryContents,
            oldDir: oldFileContents as DirectoryContents,
            parentPath: fullPath,
        });
        changes.push(...subChanges);
        return;
    }

    if (!oldIsFile && newIsFile) {
        // This is a file that is being added
        console.log(`File added: ${fullPath}`);
        const changeGroup: LineChangeGroup = {
            changeType: 'add',
            endLineNumber: countLines(newFileContents),
            newContent: newFileContents,
            startLineNumber: 1,
        };
        changes.push({
            fileName: fullPath,
            isBinary: isBinaryFile(fileName),
            lineChangeGroups: [changeGroup],
        });
        return;
    }

    if (oldIsFile && !newIsFile) {
        // This is a file that is being removed
        console.log(`File removed: ${fullPath}`);
        const changeGroup: LineChangeGroup = {
            changeType: 'remove',
            endLineNumber: countLines(oldFileContents),
            oldContent: oldFileContents,
            startLineNumber: 1,
        };
        changes.push({
            fileName: fullPath,
            isBinary: isBinaryFile(fileName),
            lineChangeGroups: [changeGroup],
        });
        return;
    }

    if (oldIsFile && newIsFile && isBinaryFile(fileName)) {
        // This is a binary file that is being changed
        console.log(`Binary file changed: ${fullPath}`);
        const changeGroup: LineChangeGroup = {
            changeType: 'replace',
            endLineNumber: countLines(newFileContents),
            newContent: newFileContents,
            oldContent: oldFileContents,
            startLineNumber: 1,
        };
        changes.push({
            fileName: fullPath,
            isBinary: isBinaryFile(fileName),
            lineChangeGroups: [changeGroup],
        });
        return;
    }

    if (oldIsFile && newIsFile) {
        console.log(`Text file changed: ${fullPath}`);
        const oldFileHash = hashFileContents(oldFileContents);
        const newFileHash = hashFileContents(newFileContents);

        if (oldFileHash === newFileHash) {
            // Files are the same, skip further processing
            console.log(`Files are identical, skipping: ${fullPath}`);
            return;
        }

        const diffs = await diffTexts(oldFileContents, newFileContents);

        let lineCount = 1;

        for (const diff of diffs) {
            if (diff.added) {
                console.log(`Line added at ${lineCount} in ${fullPath}`);
                const changeGroup: LineChangeGroup = {
                    changeType: 'add',
                    endLineNumber: lineCount,
                    newContent: diff.value,
                    startLineNumber: lineCount,
                };
                changes.push({
                    fileName: fullPath,
                    isBinary: isBinaryFile(fileName),
                    lineChangeGroups: [changeGroup],
                });
            } else if (diff.removed) {
                console.log(`Line removed at ${lineCount} in ${fullPath}`);
                const changeGroup: LineChangeGroup = {
                    changeType: 'remove',
                    endLineNumber: lineCount,
                    oldContent: diff.value,
                    startLineNumber: lineCount,
                };
                changes.push({
                    fileName: fullPath,
                    isBinary: isBinaryFile(fileName),
                    lineChangeGroups: [changeGroup],
                });
            }
            if (diff.value.includes('\n')) {
                lineCount++;
            }
        }
    }
};

const processRemovedFiles = async (
    oldDirFileNames: ReadonlyDeep<string[]>,
    oldDir: ReadonlyDeep<DirectoryContents>,
    parentPath: string | undefined,
    changes: ReadonlyDeep<FileChange[]>
): Promise<void> => {
    const removedLimit = pLimit(MAX_PROMISES_ALLOWED);

    const removedFilesPromises = oldDirFileNames.map((fileName) =>
        removedLimit(async () => {
            try {
                const oldFileContents = oldDir[fileName];
                const oldIsFile = typeof oldFileContents === 'string';
                const fullPath = parentPath
                    ? `${parentPath}/${fileName}`
                    : fileName;

                if (oldIsFile) {
                    // This is a file that is being removed
                    const changeGroup: LineChangeGroup = {
                        changeType: 'remove',
                        endLineNumber: countLines(oldFileContents),
                        oldContent: oldFileContents,
                        startLineNumber: 1,
                    };
                    changes.push({
                        fileName: fullPath,
                        isBinary: isBinaryFile(fileName),
                        lineChangeGroups: [changeGroup],
                    });
                }
            } catch (error) {
                console.error(
                    `Error processing removed file ${fileName}:`,
                    error
                );
                throw error;
            }
        })
    );

    await Promise.allSettled(removedFilesPromises);
};

export const diffDirectories = async ({
    ignoreRemovedFiles = false,
    newDir,
    oldDir,
    parentPath,
}: ReadonlyDeep<{
    ignoreRemovedFiles?: boolean;
    newDir: DirectoryContents;
    oldDir: DirectoryContents;
    parentPath?: string;
}>): Promise<FileChange[]> => {
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
    const limit = pLimit(MAX_PROMISES_ALLOWED);

    const promises = Object.entries(newDir).map(([fileName, newFileContents]) =>
        limit(async () => {
            try {
                oldDirFileNames.splice(oldDirFileNames.indexOf(fileName), 1);
                const oldFileContents = oldDir[fileName];
                const fullPath = parentPath
                    ? `${parentPath}/${fileName}`
                    : fileName;

                await processFileChange(
                    fileName,
                    newFileContents as string,
                    oldFileContents as string,
                    fullPath,
                    changes
                );
            } catch (error) {
                console.error(`Error processing file ${fileName}:`, error);
                throw error;
            }
        })
    );

    await Promise.all(promises);

    if (!ignoreRemovedFiles) {
        await processRemovedFiles(oldDirFileNames, oldDir, parentPath, changes);
    }

    return changes;
};
