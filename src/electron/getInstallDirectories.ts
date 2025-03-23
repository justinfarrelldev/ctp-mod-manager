import fs from 'fs';
import os from 'os';

const DEFAULT_WINDOWS_DIR =
    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call to Power II';
const DEFAULT_WSL2_DIR =
    '/mnt/c/Program Files (x86)/Steam/steamapps/common/Call to Power II';
const DEFAULT_LINUX_DIR = '/ctp_install';

type InstallInfo = LinuxInstallInfo | MacInstallInfo | WindowsInstallInfo;

type LinuxInstallInfo = {
    directory: string;
    installationType: 'steam';
    isWSL: boolean;
    os: 'linux';
};

type MacInstallInfo = {
    directory: string;
    installationType: 'steam';
    os: 'macos';
};

type WindowsInstallInfo = {
    directory: string;
    installationType: 'steam';
    os: 'win32';
};

export const getInstallDirectories = (): InstallInfo[] => {
    const installInfos: (
        | LinuxInstallInfo
        | MacInstallInfo
        | WindowsInstallInfo
    )[] = [];

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
                isWSL: true,
                os: 'linux',
            });
        }
    } else if (process.platform === 'linux') {
        if (fs.existsSync(DEFAULT_LINUX_DIR)) {
            installInfos.push({
                directory: DEFAULT_LINUX_DIR,
                installationType: 'steam',
                isWSL: false,
                os: 'linux',
            });
        }
    }

    if (process.platform === 'darwin') {
        if (fs.existsSync(DEFAULT_WSL2_DIR)) {
            // For now, leave the default install dir on MacOS the same as the Linux one
            installInfos.push({
                directory: DEFAULT_LINUX_DIR,
                installationType: 'steam',
                os: 'macos',
            });
        }
    }

    return installInfos;
};
