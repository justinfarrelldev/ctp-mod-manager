import fs from 'fs';

import { DEFAULT_MOD_DIR } from '../constants';

export const removeModFromMods = async (modName: string) => {
    fs.rmSync(`${DEFAULT_MOD_DIR}\\${modName}`, {
        force: true,
        recursive: true,
    });
};
