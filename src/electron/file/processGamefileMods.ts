import fs from 'fs';
import path from 'path';
import { ReadonlyDeep } from 'type-fest';

import { DEFAULT_MOD_DIR } from '../constants';
import { getGamefileFiles } from './getGamefileFiles';
import { parseGamefileContent } from './parseGamefileContent';

interface GamefileMapping {
    destination: string;
    source: null | string;
}

/**
 * Maps the gamefile content fields to their destination file names
 * @param gamefileInfo Parsed information from the gamefile
 * @returns An array of mapping objects for source and destination files
 */
const createFileMappings = (
    gamefileInfo: ReadonlyDeep<ReturnType<typeof parseGamefileContent>>
): GamefileMapping[] => {
    return [
        {
            destination: 'Great_Library.txt',
            source: gamefileInfo.greatLibraryName,
        },
        { destination: 'ldl_str.txt', source: gamefileInfo.ldlStrName },
        { destination: 'newsprite.txt', source: gamefileInfo.newspriteName },
        { destination: 'tips_str.txt', source: gamefileInfo.tipsStrName },
        {
            destination: 'gamefile.txt',
            source: path.basename(gamefileInfo.gamefilePath),
        },
    ].filter((mapping) => mapping.source !== null) as GamefileMapping[];
};

/**
 * Finds a file in the mod directory based on its filename
 * @param modDir The root directory of the mod
 * @param filename The filename to search for
 * @returns The full path to the file if found, null otherwise
 */
const findFileInMod = (
    modDir: string,
    filename: null | string
): null | string => {
    if (!filename) return null;

    // Use a stack to traverse directories without recursion
    const directories: string[] = [modDir];
    while (directories.length > 0) {
        const currentDir = directories.pop();

        try {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const itemPath = path.join(currentDir, item);
                const stats = fs.statSync(itemPath);

                if (stats.isDirectory()) {
                    directories.push(itemPath);
                } else if (item === filename) {
                    return itemPath;
                }
            }
        } catch (err) {
            console.error(`Error reading directory ${currentDir}:`, err);
        }
    }

    return null;
};
/**
 * Copies files from source directory to destination directory, preserving structure
 * @param srcDir The source directory (also used as reference for calculating relative paths)
 * @param destDir The destination directory
 * @param filesToSkip Files that should be skipped during copying (e.g. files to be renamed)
 */
const copyRemainingFiles = (
    srcDir: string,
    destDir: string,
    filesToSkip: ReadonlyDeep<string[]>
): void => {
    // Calculate relative path from srcDir to itself (empty string)
    // This simplifies the initial call but allows recursion to work with subdirectories
    const relativePath = path.relative(srcDir, srcDir);
    const targetDir = path.join(destDir, relativePath);

    // Create the target directory if it doesn't exist
    fs.mkdirSync(targetDir, { recursive: true });

    // Process each item in the current directory
    const items = fs.readdirSync(srcDir);
    for (const item of items) {
        const srcPath = path.join(srcDir, item);
        const stats = fs.statSync(srcPath);

        if (stats.isDirectory()) {
            // Recursively process subdirectories
            // For subdirectories, we need to calculate proper relative path
            const subRelPath = path.relative(srcDir, srcPath);
            const subDestDir = path.join(destDir, subRelPath);
            fs.mkdirSync(subDestDir, { recursive: true });
            copyRemainingFiles(srcPath, subDestDir, filesToSkip);
        } else {
            // Skip files that are already handled by specific mappings
            if (filesToSkip.includes(path.basename(srcPath))) {
                continue;
            }

            // Copy the file to the target directory, preserving the name
            const destPath = path.join(targetDir, item);
            fs.copyFileSync(srcPath, destPath);
        }
    }
};

/**
 * Processes a mod directory for gamefiles and creates separate mod folders with renamed files
 * @param modDir The directory containing the mod
 * @returns An array of new mod folder names created
 */
export const processGamefileMods = (modDir: string): string[] => {
    const createdMods: string[] = [];

    try {
        // Find all gamefile.txt files in the mod directory
        const gamefiles = getGamefileFiles(modDir);

        if (gamefiles.length === 0) {
            console.log('No gamefile found in the mod directory');
            return createdMods;
        }

        // Process each gamefile
        for (const gamefile of gamefiles) {
            const gamefileInfo = parseGamefileContent(
                gamefile.contents,
                gamefile.path
            );

            if (!gamefileInfo.modName) {
                console.error('No mod name found in gamefile:', gamefile.path);
                continue;
            }

            // Create a new mod folder with the name from the gamefile
            const newModDir = path.join(DEFAULT_MOD_DIR, gamefileInfo.modName);

            // Check if the mod directory already exists
            if (fs.existsSync(newModDir)) {
                console.log(`Mod directory already exists: ${newModDir}`);
            } else {
                fs.mkdirSync(newModDir, { recursive: true });
            }

            // Get file mappings from gamefile info
            const fileMappings = createFileMappings(gamefileInfo);

            // Get list of source files to skip during copying
            const filesToSkip = fileMappings
                .map((mapping) => mapping.source)
                .filter((source): source is string => source !== null);

            // Copy all mod files to the new directory, maintaining the folder structure
            copyRemainingFiles(modDir, newModDir, filesToSkip);

            // Copy each mapped file to the new mod directory with the correct name
            for (const mapping of fileMappings) {
                const sourceFilePath = findFileInMod(modDir, mapping.source);

                if (sourceFilePath) {
                    // Get the relative path from the mod root to the source file
                    const relativePath = path.relative(
                        modDir,
                        path.dirname(sourceFilePath)
                    );

                    // Create the same directory structure in the new mod folder
                    const destDir = path.join(newModDir, relativePath);
                    fs.mkdirSync(destDir, { recursive: true });

                    // Copy the file with its new name
                    const destPath = path.join(destDir, mapping.destination);
                    fs.copyFileSync(sourceFilePath, destPath);

                    console.log(`Copied ${sourceFilePath} to ${destPath}`);
                } else {
                    console.warn(
                        `Source file not found for source ${mapping.source}. Full mapping: ${JSON.stringify(
                            mapping,
                            null,
                            2
                        )}`
                    );
                }
            }

            createdMods.push(gamefileInfo.modName);
        }
    } catch (err) {
        console.error('Error processing gamefiles:', err);
    }

    return createdMods;
};
