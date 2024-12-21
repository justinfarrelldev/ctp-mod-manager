import { app } from 'electron';
import { DEFAULT_MOD_DIR, DEFAULT_MOD_FOLDER_NAME } from '../constants';
import fs from 'fs';
import AdmZip from 'adm-zip';
import klawSync from 'klaw-sync';

export const unzipInModDir = async (
    zipFullPath: string,
    fileName: string
): Promise<void> => {
    const fileFolder = fileName.replace('.zip', '');
    return new Promise((resolve) => {
        try {
            const zip = new AdmZip(zipFullPath);
            zip.extractAllToAsync(
                `${DEFAULT_MOD_DIR}\\${fileFolder}`,
                false,
                false,
                (err) => {
                    if (err) {
                        console.error(
                            `An error occurred while extracting ${zipFullPath}: ${err}`
                        );
                    }
                    resolve();
                }
            );
        } catch (err) {
            console.error(`Failed to unzip: ${err}`);
            resolve();
        }
    });
};

/**
 * Finds and returns an array of directory paths that contain the "ctp2_data" folder within the specified directory.
 *
 * @param dir - The root directory to search within.
 * @returns An array of strings representing the paths to the "ctp2_data" folders found within the specified directory.
 *
 * @throws Will log an error message if an error occurs during the search process.
 */
const findGameRootsWithinDir = (dir: string): string[] => {
    const dirs: string[] = [];
    try {
        const ctp2DataPaths = klawSync(dir)
            .filter((file) => file.path.includes('ctp2_data'))
            .map((dirWithData) => dirWithData.path.split('ctp2_data')[0]);

        ctp2DataPaths.forEach((path) => {
            if (!dirs.includes(path + 'ctp2_data'))
                dirs.push(path + 'ctp2_data');
        });
    } catch (err) {
        console.error(
            `An error occurred while searching for "ctp2_data" folders: ${err}`
        );
    }

    return dirs;
};

/**
 * Finds all zip files in the specified directory.
 *
 * @param dir - The directory to search for zip files.
 * @returns An array of paths to the zip files found in the directory.
 * @throws Will log an error message if an error occurs during the search.
 */
const findZipFilesInDir = (dir: string): string[] => {
    try {
        return klawSync(dir)
            .filter((files) => files.path.toLowerCase().endsWith('.zip'))
            .map((item) => item.path);
    } catch (err) {
        console.error(
            `An error occurred while searching for zip files: ${err}`
        );
    }
};

/**
 * Extracts the contents of a zip file to the specified target directory asynchronously.
 *
 * @param {AdmZip} zip - The zip file to extract.
 * @param {string} targetPath - The path to the directory where the contents should be extracted.
 * @returns {Promise<void>} A promise that resolves when the extraction is complete.
 */
const extract = (zip: AdmZip, targetPath: string): Promise<void> => {
    return new Promise((resolve) => {
        zip.extractAllToAsync(targetPath, false, false, (err) => {
            if (err)
                console.error(
                    `An error occurred while extracting to ${targetPath}: ${err}`
                );

            resolve();
        });
    });
};

/**
 * Unzips all zip files found within the specified destination directory and its subdirectories.
 *
 * This function searches through every folder for zip files, extracting them as they are found.
 * If no zip files are found, it quits with success and moves on to the next step of the process.
 *
 * @param destination - The path to the directory where the search for zip files will begin.
 * @returns A promise that resolves when all zip files have been extracted.
 */
const unzipAllFiles = async (destination: string): Promise<void> => {
    // Search through every folder for zip files, extracting as it finds them
    // If it does not find them, it quits with success and moves on to the next step of the process
    let zipFilesInDirs = findZipFilesInDir(destination.replace('.zip', ''));

    while (zipFilesInDirs.length > 0) {
        for (const file of zipFilesInDirs) {
            const splitFile = file.split('\\');
            const name = splitFile[splitFile.length - 1];

            const zipFile = new AdmZip(file);
            // eslint-disable-next-line no-await-in-loop
            await extract(zipFile, file.replace(name, ''));
            fs.rmSync(file);
            // eslint-disable-next-line no-await-in-loop
            zipFilesInDirs = await findZipFilesInDir(
                destination.replace('.zip', '')
            );
        }
    }
};

/**
 * Copies multiple data folders to the specified mod directory.
 *
 * @param dirs - An array of directory paths to be copied.
 * @param modDir - The target mod directory where the data folders will be copied.
 *
 * @remarks
 * If the `dirs` array is empty, the function will return immediately without performing any operations.
 * After copying the data folders, the function will remove the target mod directory if it exists.
 */
const copyDataFoldersToModDirs = (dirs: string[], modDir: string): void => {
    if (dirs.length === 0) return;
    dirs.forEach((dir) => {
        copyDataFolderToModDir(dir);
    });

    fs.rmSync(modDir.replace('.zip', ''), {
        recursive: true,
        force: true,
    });
};

/**
 * Copies the contents of a directory ending with 'ctp2_data' to a mod directory.
 *
 * @param dir - The directory path that ends with 'ctp2_data'.
 * @throws Will throw an error if the directory does not end with 'ctp2_data'.
 *
 * The function extracts the parent directory name of the provided directory,
 * removes the 'ctp2_data' suffix, and then copies the contents of the resulting
 * directory to a predefined mod directory.
 *
 * If an error occurs during the copy operation, it logs the error to the console.
 */
const copyDataFolderToModDir = (dir: string): void => {
    if (!dir.endsWith('ctp2_data')) {
        throw new Error(
            `Dir passed to copyDataFolderToModDir that does not end with ctp2_data: ${dir}. Aborting.`
        );
    }

    const splitDir = dir.split('\\');

    const parentDirName = splitDir[splitDir.length - 2];

    const dirToMove = dir.replace('\\ctp2_data', '');

    try {
        fs.cpSync(dirToMove, `${DEFAULT_MOD_DIR}\\${parentDirName}`, {
            recursive: true,
        });
    } catch (err) {
        console.error(
            `An error occurred while copying the directory ${dirToMove} to ${DEFAULT_MOD_DIR}: ${err}`
        );
    }
};

/**
 * Copies a file to the mod directory, unzips it, and processes its contents.
 *
 * @param fileDir - The directory of the file to be copied.
 *
 * This function performs the following steps:
 * 1. Extracts the file name from the provided file directory.
 * 2. Checks if the default mod directory exists and creates it if it doesn't.
 * 3. Constructs the destination path for the file in the mod directory.
 * 4. Unzips the file in the mod directory.
 * 5. Unzips all files within the destination directory.
 * 6. Finds game root directories within the unzipped contents.
 * 7. Copies the data folders to the mod directories.
 *
 * @throws Will log an error if there is an issue getting the stats for the directory.
 */
export const copyFileToModDir = async (fileDir: string) => {
    const split = fileDir.split('\\');
    const fileName = split[split.length - 1];
    let stats: fs.Stats | undefined;
    try {
        stats = fs.statSync(DEFAULT_MOD_DIR);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the directory ${DEFAULT_MOD_DIR}: ${err}`
        );
        await createAppDataFolder(DEFAULT_MOD_FOLDER_NAME);
    }

    if (stats) {
        if (!stats.isDirectory())
            await createAppDataFolder(DEFAULT_MOD_FOLDER_NAME);
    }

    const destination = `${DEFAULT_MOD_DIR}\\${fileName}`;
    await unzipInModDir(fileDir, fileName);

    await unzipAllFiles(destination);

    const dataDirs = findGameRootsWithinDir(destination.replace('.zip', ''));

    copyDataFoldersToModDirs(dataDirs, destination.replace('.zip', ''));
};

/**
 * Creates a folder in the application's AppData directory with the specified name.
 *
 * @param name - The name of the folder to create.
 * @throws Will throw an error if there is an issue getting the app path or creating the folder.
 */
export const createAppDataFolder = async (name: string) => {
    let folderPath;
    try {
        folderPath = `${app.getPath('appData')}\\${app.getName()}\\${name}`;
        console.log('folder path: ', folderPath);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the app path to the AppData folder: ${err}`
        );
        throw err;
    }

    fs.mkdir(folderPath, (err) => {
        if (err) throw err;
    });
};
