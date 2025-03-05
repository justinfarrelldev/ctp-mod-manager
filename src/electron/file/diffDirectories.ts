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
export const processFileChange = async (
    fileName: string,
    newFileContents: string,
    oldFileContents: string,
    fullPath: string,
    changes: ReadonlyDeep<FileChange[]>,
    ignoreRemovedFiles: boolean
): Promise<FileChange[]> => {
    console.log(`Processing file change for: ${fileName}`);
    const oldIsFile = typeof oldFileContents === 'string';
    const newIsFile = typeof newFileContents === 'string';

    const newChanges: FileChange[] = [...changes] as FileChange[];

    if (!oldIsFile && !newIsFile) {
        // This is a directory, we want to recursively call this on it and append the results
        console.log(`Directory detected: ${fullPath}`);
        const subChanges = await diffDirectories({
            ignoreRemovedFiles,
            newDir: newFileContents as DirectoryContents,
            oldDir: oldFileContents as DirectoryContents,
            parentPath: fullPath,
        });
        newChanges.push(...subChanges);
        return newChanges;
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
        newChanges.push({
            fileName: fullPath,
            isBinary: isBinaryFile(fileName),
            lineChangeGroups: [changeGroup],
        });
        return newChanges;
    }

    if (oldIsFile && !newIsFile && !ignoreRemovedFiles) {
        // This is a file that is being removed
        console.log(`File removed: ${fullPath}`);
        const changeGroup: LineChangeGroup = {
            changeType: 'remove',
            endLineNumber: countLines(oldFileContents),
            oldContent: oldFileContents,
            startLineNumber: 1,
        };
        newChanges.push({
            fileName: fullPath,
            isBinary: isBinaryFile(fileName),
            lineChangeGroups: [changeGroup],
        });
        return newChanges;
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
        newChanges.push({
            fileName: fullPath,
            isBinary: isBinaryFile(fileName),
            lineChangeGroups: [changeGroup],
        });
        return newChanges;
    }

    if (oldIsFile && newIsFile) {
        console.log(`Text file changed: ${fullPath}`);
        const oldFileHash = hashFileContents(oldFileContents);
        const newFileHash = hashFileContents(newFileContents);

        if (oldFileHash === newFileHash) {
            // Files are the same, skip further processing
            console.log(`Files are identical, skipping: ${fullPath}`);
            return newChanges;
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
                newChanges.push({
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
                newChanges.push({
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

    return newChanges;
};

const processRemovedFiles = async (
    oldDirFileNames: ReadonlyDeep<string[]>,
    oldDir: ReadonlyDeep<DirectoryContents>,
    parentPath: string | undefined,
    changes: ReadonlyDeep<FileChange[]>
): Promise<FileChange[]> => {
    const removedLimit = pLimit(MAX_PROMISES_ALLOWED);

    const newChanges: FileChange[] = [...changes] as FileChange[];

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
                    newChanges.push({
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

    return newChanges;
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

    let changes: FileChange[] = [];

    // Every time we see a file, remove it from this list so we can detect which were deleted
    const oldDirFileNames: string[] = Object.keys(oldDir);
    const limit = pLimit(MAX_PROMISES_ALLOWED);

    const promises = Object.entries(newDir).map(([fileName, newFileContents]) =>
        limit(async () => {
            try {
                const index = oldDirFileNames.indexOf(fileName);
                if (index !== -1) {
                    oldDirFileNames.splice(index, 1);
                }
                const oldFileContents = oldDir[fileName];
                const fullPath = parentPath
                    ? `${parentPath}/${fileName}`
                    : fileName;

                const newChanges = await processFileChange(
                    fileName,
                    newFileContents as string,
                    oldFileContents as string,
                    fullPath,
                    changes,
                    ignoreRemovedFiles // Pass through to handle removals
                );

                changes = newChanges;
            } catch (error) {
                console.error(`Error processing file ${fileName}:`, error);
                throw error;
            }
        })
    );

    await Promise.all(promises);

    // Only process removed files if the option is not set to ignore them
    if (!ignoreRemovedFiles) {
        const newChanges = await processRemovedFiles(
            oldDirFileNames,
            oldDir,
            parentPath,
            changes
        );

        changes = newChanges;
    }

    return changes;
};
