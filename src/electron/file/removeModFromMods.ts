import { DEFAULT_MOD_DIR } from '../constants';
import fs from 'fs';

export const removeModFromMods = async (modName: string) => {
    fs.rmSync(`${DEFAULT_MOD_DIR}\\${modName}`, {
        force: true,
        recursive: true,
    });
};
