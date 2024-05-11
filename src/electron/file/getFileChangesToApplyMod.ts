import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'node:fs';
import path from 'node:path';
import * as diff from 'diff';

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

const processDirectory = (
    oldContent: DirectoryContents,
    newContent: DirectoryContents,
    prefix: string = ''
) => {
    const changes: FileChange[] = [];
    for (const key of Object.keys(newContent)) {
        const oldFilePath = oldContent[key];
        const newFilePath = newContent[key];
        const fullPath = prefix + key;

        if (
            typeof newFilePath === 'object' &&
            typeof oldFilePath === 'object'
        ) {
            // Recursive case: both are directories
            processDirectory(oldFilePath, newFilePath, fullPath + '/');
        } else if (
            typeof newFilePath === 'string' &&
            typeof oldFilePath === 'string'
        ) {
            // Base case: both are files
            const fileChanges = getFileChanges(
                fullPath,
                oldFilePath,
                newFilePath
            );
            if (fileChanges.lineChangeGroups.length > 0) {
                changes.push(fileChanges);
            }
        }
    }

    return changes;
};

// Function to compare two DirectoryContents objects
const compareDirectories = (
    oldDir: DirectoryContents,
    newDir: DirectoryContents
): FileChange[] => {
    return processDirectory(oldDir, newDir);
};

// Function to get file changes
const getFileChanges = (
    fileName: string,
    oldContent: string,
    newContent: string
): FileChange => {
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

export const getFileChangesToApplyMod = (
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

        const fileChanges = compareDirectories(
            gameDirStructure,
            modDirStructure
        );

        console.log('file changes: ', JSON.stringify(fileChanges));
    }
};
