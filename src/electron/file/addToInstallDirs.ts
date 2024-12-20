import * as fs from 'fs';
import {
    DEFAULT_INSTALLS_DIR,
    DEFAULT_INSTALLS_FILE,
    DEFAULT_INSTALLS_FOLDER_NAME,
} from '../constants';
import { createAppDataFolder } from './copyFileToModDir';

const makeDirDefaultArray = (dir: string) => {
    try {
        return JSON.stringify([dir]);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while stringifying JSON into a default array for the directory ${dir}: ${err}`
        );
    }
};

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

export const ensureInstallFileExists = async (dir?: string): Promise<void> => {
    let statsOfFile: fs.Stats | undefined;
    try {
        statsOfFile = fs.statSync(DEFAULT_INSTALLS_FILE);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the file ${DEFAULT_INSTALLS_FILE}: ${err}`
        );
        try {
            if (dir) {
                fs.writeFileSync(
                    DEFAULT_INSTALLS_FILE,
                    makeDirDefaultArray(dir)
                );
            } else {
                fs.writeFileSync(DEFAULT_INSTALLS_FILE, '[]');
            }
            return;
        } catch (fileWriteErr) {
            // eslint-disable-next-line no-console
            console.error(
                `An error occurred while writing "[]" to the file ${DEFAULT_INSTALLS_FILE}: ${fileWriteErr}`
            );
        }
    }

    if (statsOfFile) {
        if (!statsOfFile.isFile()) {
            try {
                if (dir) {
                    fs.writeFileSync(
                        DEFAULT_INSTALLS_FILE,
                        makeDirDefaultArray(dir)
                    );
                } else {
                    fs.writeFileSync(DEFAULT_INSTALLS_FILE, '[]');
                }
            } catch (fileWriteErr) {
                // eslint-disable-next-line no-console
                console.error(
                    `An error occurred while writing "[]" to the file ${DEFAULT_INSTALLS_FILE}: ${fileWriteErr}`
                );
            }
        }
    }
};

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

    let jsonFile: string[];
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

export const addToInstallDirs = async (dir: string) => {
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
