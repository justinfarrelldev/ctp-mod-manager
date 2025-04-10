import fs from 'fs';
import path from 'path';

/**
 * A gamefile refers to any file in a mod ending in 'gamefile.txt'. These files are used in the Modswapper program
 * to apply various mods and contain information about the mod being applied. They are NOT referring to game asset files.
 */

type GamefileInfo = {
    contents: string;
    fileName: string;
    path: string;
};

/**
 * Retrieves an array of game file information objects from a specified directory and all its subdirectories.
 *
 * This function iteratively scans the provided directory and all its subdirectories for files that
 * end with 'gamefile.txt', reads their contents, and returns an array of objects containing
 * the file contents and file names.
 * @param dir - The directory to search for game files.
 * @returns An array of `GamefileInfo` objects, each containing the contents and name
 *          of a game file.
 * @throws Logs an error to the console if directories cannot be read or if any
 *         file operations fail.
 */
export const getGamefileFiles = (dir: string): GamefileInfo[] => {
    const result: GamefileInfo[] = [];
    const directories: string[] = [dir];

    while (directories.length > 0) {
        const currentDir = directories.pop();

        try {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const itemPath = path.join(currentDir, item);

                try {
                    const stats = fs.statSync(itemPath);

                    if (stats.isDirectory()) {
                        directories.push(itemPath);
                    } else if (
                        stats.isFile() &&
                        item.endsWith('gamefile.txt')
                    ) {
                        const contents = fs.readFileSync(itemPath, 'utf-8');
                        result.push({
                            contents,
                            fileName: item,
                            path: itemPath,
                        });
                    }
                } catch (err) {
                    console.error(`Error processing path ${itemPath}:`, err);
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${currentDir}:`, err);
        }
    }

    return result;
};
