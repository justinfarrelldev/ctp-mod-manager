import * as fs from 'fs';

import {
    DEFAULT_INSTALLS_DIR,
    DEFAULT_INSTALLS_FILE,
    DEFAULT_INSTALLS_FOLDER_NAME,
} from '../constants';
import { createAppDataFolder } from './copyFileToModDir';

/**
 * Generates a JSON string representation of an array containing the provided directory.
 * @param dir - The directory to be included in the JSON array.
 * @returns A JSON string representation of an array containing the provided directory.
 * @throws Will log an error message if JSON stringification fails.
 */
const generateJsonArrayFromDir = (dir: string) => {
    try {
        return JSON.stringify([dir]);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while stringifying JSON into a default array for the directory ${dir}: ${err}`
        );
    }
};

/**
 * Ensures that the default installs folder exists. If the folder does not exist,
 * it attempts to create it. If the path exists but is not a directory, it also
 * attempts to create the folder.
 * @returns A promise that resolves when the folder is ensured to exist.
 * @throws Will log an error to the console if there is an issue accessing the directory stats.
 */
export const ensureInstallsFolderExists = async (): Promise<void> => {
    let stats: fs.Stats | undefined;
    try {
        stats = fs.statSync(DEFAULT_INSTALLS_DIR);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the directory ${DEFAULT_INSTALLS_DIR}: ${err}`
        );
        await createAppDataFolder(DEFAULT_INSTALLS_FOLDER_NAME);
    }

    if (stats) {
        if (!stats.isDirectory())
            await createAppDataFolder(DEFAULT_INSTALLS_FOLDER_NAME);
    }
};

/**
 * Writes a JSON array to the default installs file.
 * @param jsonArray - The JSON array to write to the file.
 * @throws Will log an error to the console if there is an error writing to the file.
 */
export const writeJsonArrayToFile = (jsonArray: string): void => {
    try {
        fs.writeFileSync(DEFAULT_INSTALLS_FILE, jsonArray);
    } catch (fileWriteErr) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while writing to the file ${DEFAULT_INSTALLS_FILE}: ${fileWriteErr}`
        );
    }
};

/**
 * Ensures that the default installs file exists. If the file does not exist or is not a file,
 * it creates the file and writes an empty JSON array or a JSON array generated from the provided directory.
 * @param [dir] - Optional directory path to generate a JSON array from and write to the file.
 * @returns - A promise that resolves when the operation is complete.
 * @throws Will log an error to the console if there is an error getting the file stats or writing to the file.
 */
export const ensureInstallFileExists = async (dir?: string): Promise<void> => {
    let statsOfFile: fs.Stats | undefined;
    try {
        statsOfFile = fs.statSync(DEFAULT_INSTALLS_FILE);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the file ${DEFAULT_INSTALLS_FILE}: ${err}`
        );
        const jsonArray = dir ? generateJsonArrayFromDir(dir) : '[]';
        writeJsonArrayToFile(jsonArray);
        return;
    }

    if (statsOfFile && !statsOfFile.isFile()) {
        const jsonArray = dir ? generateJsonArrayFromDir(dir) : '[]';
        writeJsonArrayToFile(jsonArray);
    }
};

/**
 * Parses the contents of the default installs file into a JSON array.
 * @returns An array of strings parsed from the JSON file.
 * @throws Will log an error to the console if the file cannot be read or if the contents cannot be parsed as JSON.
 */
export const parseInstallFileIntoJSON = (): string[] => {
    let contents;
    try {
        contents = fs.readFileSync(DEFAULT_INSTALLS_FILE).toString();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while reading the file ${DEFAULT_INSTALLS_FILE}: ${err}`
        );
    }

    let jsonFile: string[] = [];
    try {
        jsonFile = JSON.parse(contents);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while converting the file contents to JSON: ${err}`
        );
    }
    return jsonFile;
};

/**
 * Adds a directory to the install directories list.
 *
 * This function ensures that the installs folder and the install file exist,
 * then parses the install file into a JSON array. If the directory is already
 * in the list, it logs a message and returns. Otherwise, it adds the directory
 * to the list and writes the updated list back to the install file.
 * @param dir - The directory to add to the install directories list.
 * @returns A promise that resolves when the operation is complete.
 * @throws Will log an error message if there is an issue writing to the install file.
 */
export const addToInstallDirs = async (dir: string): Promise<void> => {
    await ensureInstallsFolderExists();

    await ensureInstallFileExists(dir);

    let jsonFile: string[] = parseInstallFileIntoJSON();

    if (jsonFile.includes(dir)) {
        // eslint-disable-next-line no-console
        console.log('No-op - install directory is already in the file!');
        return;
    }

    try {
        const newArr = [...jsonFile, dir];
        jsonFile = newArr;
        const dataToPush = JSON.stringify(jsonFile);
        fs.writeFileSync(DEFAULT_INSTALLS_FILE, dataToPush);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while writing the new data to the file ${DEFAULT_INSTALLS_FILE}: ${err}`
        );
    }
};
