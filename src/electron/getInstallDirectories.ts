import fs from 'fs';
import os from 'os';

const DEFAULT_WINDOWS_DIR =
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call to Power II';
const DEFAULT_WSL2_DIR =
    '/mnt/c/Program Files (x86)/Steam/steamapps/common/Call to Power II';

export const getInstallDirectories = () => {
    const installInfos = [];
    // C:\Program Files (x86)\Steam\steamapps\common\Call to Power II
    if (process.platform === 'win32') {
        if (fs.existsSync(DEFAULT_WINDOWS_DIR)) {
            installInfos.push({
                directory: DEFAULT_WINDOWS_DIR,
                installationType: 'steam',
                os: process.platform,
            });
        }
    }
    // WSL
    if (
        process.platform === 'linux' &&
        os.release().toLowerCase().includes('microsoft')
    ) {
        if (fs.existsSync(DEFAULT_WSL2_DIR)) {
            installInfos.push({
                directory: DEFAULT_WSL2_DIR,
                installationType: 'steam',
                os: process.platform,
            });
        }
    }

    return installInfos;
};
