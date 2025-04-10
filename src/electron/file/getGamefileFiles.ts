import fs from 'fs';
import path from 'path';

/**
 * A gamefile refers to any file in a mod ending in 'gamefile.txt'. These files are used in the Modswapper program
 * to apply various mods and contain information about the mod being applied. They are NOT referring to game asset files.
 */

type GamefileInfo = {
    contents: string;
    fileName: string;
};

/**
 * Retrieves an array of game file information objects from a specified directory.
 *
 * This function scans the provided directory for files that end with 'gamefile.txt',
 * reads their contents, and returns an array of objects containing the file contents
 * and file names.
 * @param dir - The directory to search for game files.
 * @returns An array of `GamefileInfo` objects, each containing the contents and name
 *          of a game file.
 * @throws Logs an error to the console if the directory cannot be read or if any
 *         file operations fail.
 */
export const getGamefileFiles = (dir: string): GamefileInfo[] => {
    const result: GamefileInfo[] = [];

    try {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);

            if (
                fs.statSync(filePath).isFile() &&
                file.endsWith('gamefile.txt')
            ) {
                const contents = fs.readFileSync(filePath, 'utf-8');
                result.push({ contents, fileName: file });
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }

    return result;
};
