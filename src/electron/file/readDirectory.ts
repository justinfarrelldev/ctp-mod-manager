import fs from 'node:fs';
import path from 'node:path';

// Define the type for the nested object structure
export type DirectoryContents = {
    [key: string]: DirectoryContents | string;
};

/**
 * Recursively reads the contents of a directory and returns an object representing the directory structure.
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
