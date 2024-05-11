import { DEFAULT_MOD_DIR } from '../constants';
import fs, { ObjectEncodingOptions } from 'node:fs';
import path from 'node:path';
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
const limit = pLimit(50);

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
    let promises: Promise<void>[] = [];

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
                processDirectory(oldFilePath, newFilePath, fullPath + '/').then(
                    (value) => {
                        changes = [...changes, ...value];
                    }
                )
            );
        } else if (
            typeof newFilePath === 'string' &&
            typeof oldFilePath === 'string'
        ) {
            promises.push(
                getFileChanges(fullPath, oldFilePath, newFilePath).then(
                    (fileChanges) => {
                        if (fileChanges.lineChangeGroups.length > 0) {
                            changes.push(fileChanges);
                        }
                    }
                )
            );
        }
    }
    return Promise.all(promises).then(() => {
        return changes;
    });
}

async function compareDirectories(
    oldDir: DirectoryContents,
    newDir: DirectoryContents
): Promise<FileChange[]> {
    return processDirectory(oldDir, newDir);
}

async function getFileChanges(
    fileName: string,
    oldContent: string,
    newContent: string
): Promise<FileChange> {
    const changeDiffs = diff.diffLines(oldContent, newContent);
    const lineChangeGroups: LineChangeGroup[] = [];
    let lineIndex = 1;

    for (const part of changeDiffs) {
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
        fileName,
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
