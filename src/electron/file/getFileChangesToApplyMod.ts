import { DEFAULT_MOD_DIR } from '../constants';
import fs, { ObjectEncodingOptions } from 'node:fs';
import path, { resolve } from 'node:path';
import * as diff from 'diff';
import pLimit from 'p-limit';
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

// Function to read directory contents recursively
const readDirectory = (dirPath: string): DirectoryContents => {
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

const diffLineDiffMatchPatch = (
    text1: string,
    text2: string
): diff_match_patch.Diff[] => {
    const dmp = new diff_match_patch();
    const a = dmp.diff_linesToChars_(text1, text2);
    const lineText1 = a.chars1;
    const lineText2 = a.chars2;
    const lineArray = a.lineArray;
    const diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    return diffs;
};

async function processDirectory(
    oldContent: DirectoryContents,
    newContent: DirectoryContents,
    prefix: string = ''
): Promise<FileChange[]> {
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
        console.log('prefix: ', prefix);

        for (const key of Object.keys(newContent)) {
            const oldFilePath = oldContent[key];
            const newFilePath = newContent[key];
            const fullPath = prefix + key;

            console.log('now processing: ', fullPath);

            if (
                typeof newFilePath === 'object' &&
                typeof oldFilePath === 'object'
            ) {
                // If both are directories, push to stack to process later
                stack.push({
                    oldContent: oldFilePath,
                    newContent: newFilePath,
                    prefix: fullPath + '/',
                });
            } else if (
                typeof newFilePath === 'string' &&
                typeof oldFilePath === 'string'
            ) {
                if (
                    (newFilePath.endsWith('.tga') &&
                        oldFilePath.endsWith('.tga')) ||
                    (newFilePath.endsWith('.til') &&
                        oldFilePath.endsWith('.til')) ||
                    (newFilePath.endsWith('.pdf') &&
                        oldFilePath.endsWith('.pdf'))
                ) {
                    if (
                        fs.readFileSync(newFilePath).byteLength !==
                        fs.readFileSync(oldFilePath).byteLength
                    ) {
                        changes.push({
                            fileName: fullPath,
                            isBinary: true,
                        });
                    }
                }

                if (oldFilePath.length === newFilePath.length) {
                    // These are very likely the same
                    continue;
                } else if (newFilePath.split('\n').length > 400) {
                    const diffs = diffLineDiffMatchPatch(
                        oldFilePath,
                        newFilePath
                    );
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
                                oldFilePath,
                                newFilePath,
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
            }
        }
    }

    // Wait for all file diffs to be resolved
    const fileDiffs = await Promise.all(fileDiffPromises);

    // Convert file diffs to file changes
    for (const diff of fileDiffs) {
        changes.push(getFileChanges(diff));
    }

    return changes;
}

async function compareDirectories(
    oldDir: DirectoryContents,
    newDir: DirectoryContents
): Promise<FileChange[]> {
    return processDirectory(oldDir, newDir);
}

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

        console.log(`Got value for ${fileName}`);

        onValueGotten(value);
    });
};

function getFileChanges(fileDiff: FileDiff): FileChange {
    const lineChangeGroups: LineChangeGroup[] = [];
    let lineIndex = 1;

    for (const part of fileDiff.changeDiffs) {
        if (part.added || part.removed) {
            const startLine = lineIndex;
            const endLine = lineIndex + part.count - 1;
            lineChangeGroups.push({
                startLineNumber: startLine,
                endLineNumber: endLine,
                change: part.added ? part.value : '',
                contentBeforeChange: part.removed ? part.value : '',
            });
        }
        lineIndex += part.count;
    }

    return {
        fileName: fileDiff.fileName,
        lineChangeGroups,
    };
}

export const getFileChangesToApplyMod = async (
    mod: string,
    installDir: string
): Promise<FileChange[]> => {
    console.log('Running code!');

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

        console.log('reading mod dir structure!');
        const modDirStructure = readDirectory(`${DEFAULT_MOD_DIR}\\${mod}`);

        console.log('reading game dir structure!');
        const gameDirStructure = readDirectory(installDir);

        console.log('comparing dirs!');
        compareDirectories(gameDirStructure, modDirStructure).then(
            (fileChanges) => {
                console.log('file changes: ', JSON.stringify(fileChanges));
            }
        );
    }
};
