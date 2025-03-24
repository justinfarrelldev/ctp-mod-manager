import fs from 'fs';

const CTP2_CHECKED_DIR = 'ctp2_data';

export const isValidInstall = async (dir: string): Promise<boolean> => {
    // If there is a ctp2_data dir on the top level, it is a valid install
    return (
        fs.readdirSync(dir).filter((file) => file.endsWith(CTP2_CHECKED_DIR))
            .length > 0
    );
};
