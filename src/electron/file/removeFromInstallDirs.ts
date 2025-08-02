import * as fs from 'fs';

import { DEFAULT_INSTALLS_FILE } from '../constants';
import {
    ensureInstallFileExists,
    ensureInstallsFolderExists,
    parseInstallFileIntoJSON,
} from './addToInstallDirs';

export const removeFromInstallDirs = async (dir: string): Promise<void> => {
    await ensureInstallsFolderExists();

    await ensureInstallFileExists(dir);

    const jsonFile: string[] = parseInstallFileIntoJSON();

    if (!jsonFile.includes(dir)) {
        // eslint-disable-next-line no-console
        console.log('No-op - install directory is not present in the file!');
        return;
    }

    const index = jsonFile.indexOf(dir);

    try {
        jsonFile.splice(index, 1);
        const dataToPush = JSON.stringify(jsonFile);
        fs.writeFileSync(DEFAULT_INSTALLS_FILE, dataToPush);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while writing the new data to the file ${DEFAULT_INSTALLS_FILE}: ${err}`
        );
    }
};
