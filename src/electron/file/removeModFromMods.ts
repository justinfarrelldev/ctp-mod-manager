import fs from 'fs';
import path from 'path';

import { DEFAULT_MOD_DIR } from '../constants';

export const removeModFromMods = async (modName: string): Promise<void> => {
    fs.rmSync(path.join(DEFAULT_MOD_DIR, modName), {
        force: true,
        recursive: true,
    });
};
