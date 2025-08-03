import fs from 'fs';

import { isGameDataDir } from './ctpVariants';

export const isValidInstall = async (dir: string): Promise<boolean> => {
    // If there is a ctp2_data or ctp_data dir on the top level, it is a valid install
    // Accept both string[] and Buffer[] for test and prod compatibility
    const files = fs.readdirSync(dir, { withFileTypes: false });
    const fileNames = files.map((f) =>
        typeof f === 'string' ? f : Buffer.isBuffer(f) ? f.toString() : ''
    );
    return fileNames.some(isGameDataDir);
};
