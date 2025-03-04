import fs from 'fs';
import os from 'os';

const DEFAULT_WINDOWS_DIR =
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call to Power II';
const DEFAULT_WSL2_DIR =
    '/mnt/c/Program Files (x86)/Steam/steamapps/common/Call to Power II';

type InstallInfo = WindowsInstallInfo | WSLInstallInfo;

type WindowsInstallInfo = {
    directory: string;
    installationType: 'steam';
    os: 'win32';
};

type WSLInstallInfo = {
    directory: string;
    installationType: 'steam';
    os: 'linux';
};

export const getInstallDirectories = (): InstallInfo[] => {
    const installInfos: (WindowsInstallInfo | WSLInstallInfo)[] = [];

    if (process.platform === 'win32') {
        if (fs.existsSync(DEFAULT_WINDOWS_DIR)) {
            installInfos.push({
                directory: DEFAULT_WINDOWS_DIR,
                installationType: 'steam',
                os: 'win32',
            });
        }
    }

    if (
        process.platform === 'linux' &&
        os.release().toLowerCase().includes('microsoft')
    ) {
        if (fs.existsSync(DEFAULT_WSL2_DIR)) {
            installInfos.push({
                directory: DEFAULT_WSL2_DIR,
                installationType: 'steam',
                os: 'linux',
            });
        }
    }

    return installInfos;
};
