import fs from 'fs';

import { DEFAULT_MOD_DIR } from '../constants';

/**
 * Loads the list of mod filenames from the default mod directory.
 *
 * If the default mod directory does not exist, it will be created.
 * @returns An array of filenames present in the default mod directory.
 * @throws Will throw an error if there is an issue reading the files from the directory.
 */
export const loadModFileNames = (): string[] => {
    if (!fs.existsSync(DEFAULT_MOD_DIR)) {
        fs.mkdirSync(DEFAULT_MOD_DIR);
    }
    try {
        const filenames = fs.readdirSync(DEFAULT_MOD_DIR);
        return filenames;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while reading the files at ${DEFAULT_MOD_DIR}: ${err}`
        );
        throw err;
    }
};
