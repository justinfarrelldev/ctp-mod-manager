import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'node:fs';
import path from 'node:path';

// Define the type for the nested object structure
type DirectoryContents = {
    [key: string]: string | DirectoryContents;
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

export const getFileChangesToApplyMod = (
    mod: string
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

        const dirStructure = readDirectory(`${DEFAULT_MOD_DIR}\\${mod}`);
        console.log('dir structure:');

        console.log(JSON.stringify(dirStructure));
    }
};
