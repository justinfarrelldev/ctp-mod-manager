import { DEFAULT_MOD_DIR } from '../constants';
import fs, { ObjectEncodingOptions } from 'node:fs';
import path, { resolve } from 'node:path';
import * as diff from 'diff';
import pLimit from 'p-limit';

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
type FileChange = {
    fileName: string;
    lineChangeGroups: LineChangeGroup[];
};
// Limit the number of concurrent file reads
const limit = pLimit(5);

const readdirPromisified = async (
    path: fs.PathLike,
    options: ObjectEncodingOptions & {
        withFileTypes: true;
    }
): Promise<fs.Dirent[]> => {
    return new Promise((resolve) => {
        fs.readdir(path, options, (err, files) => {
            if (err)
                console.error(
                    `An error occurred while reading a directory: ${err}`
                );

            resolve(files);
        });
    });
};

const readfilePromisified = async (fullPath: string): Promise<string> => {
    return new Promise((resolve) => {
        fs.readFile(fullPath, 'utf-8', (err, data) => {
            if (err)
                console.error(`An error occurred while reading a file: ${err}`);

            resolve(data);
        });
    });
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

async function processDirectory(
    oldContent: DirectoryContents,
    newContent: DirectoryContents,
    prefix: string = ''
): Promise<FileChange[]> {
    let changes: FileChange[] = [];
    let promises: Promise<FileChange[]>[] = [];
    let fileDiffPromises: Promise<FileDiff>[] = [];

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
            promises.push(
                limit(async () =>
                    processDirectory(oldFilePath, newFilePath, fullPath + '/')
                )
            );
        } else if (
            typeof newFilePath === 'string' &&
            typeof oldFilePath === 'string'
        ) {
            fileDiffPromises.push(
                new Promise<FileDiff>((resolve) => {
                    getFileDiff(oldFilePath, newFilePath, fullPath, (value) => {
                        resolve({
                            fileName: fullPath,
                            changeDiffs: value,
                        });
                    });
                })
            );
        }
    }

    return Promise.all(promises).then((results) => {
        return Promise.all(fileDiffPromises).then((fileDiffs) => {
            let fileChanges: FileChange[] = [];

            for (const diff of fileDiffs) {
                fileChanges.push(getFileChanges(diff));
            }

            for (const resolvedPromise of results) {
                changes = [...changes, ...resolvedPromise, ...fileChanges];
            }
            return changes;
        });
    });
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
