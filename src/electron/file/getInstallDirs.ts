import { DEFAULT_INSTALLS_FILE } from '../constants';
import {
    ensureInstallFileExists,
    ensureInstallsFolderExists,
} from './addToInstallDirs';
import * as fs from 'fs';

export const getInstallDirs = async (): Promise<string[]> => {
    await ensureInstallsFolderExists();

    await ensureInstallFileExists();

    let contents: string;
    try {
        contents = fs.readFileSync(DEFAULT_INSTALLS_FILE).toString();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while reading from the installations file: ${err}`
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
