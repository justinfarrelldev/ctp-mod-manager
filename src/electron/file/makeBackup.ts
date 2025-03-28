import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';

import {
    DEFAULT_BACKUPS_FOLDER,
    DEFAULT_BACKUPS_FOLDER_NAME,
} from '../constants';
import { createAppDataFolder } from './copyFileToModDir';

export const selectivelyAddBackupsFolder = async (): Promise<void> => {
    let stats: fs.Stats | undefined;
    try {
        stats = fs.statSync(DEFAULT_BACKUPS_FOLDER);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
            `An error occurred while getting the stats for the directory ${DEFAULT_BACKUPS_FOLDER}: ${err}`
        );
        await createAppDataFolder(DEFAULT_BACKUPS_FOLDER_NAME);
    }

    if (stats) {
        if (!stats.isDirectory())
            await createAppDataFolder(DEFAULT_BACKUPS_FOLDER_NAME);
    }
};

/**
 * Creates a backup of the specified installation directory by zipping its contents
 * and saving the zip file in the backups folder.
 * @param installDir - The directory to back up.
 * @param backupName - Optional custom name for the backup.
 * @returns A promise that resolves when the backup is complete.
 * @throws Will log an error message if an error occurs during the zipping process.
 */
export const makeBackup = async (
    installDir: string,
    backupName?: string
): Promise<void> => {
    await selectivelyAddBackupsFolder();
    const zip = new AdmZip();

    try {
        console.log('adding local folder to zip: ', installDir);
        zip.addLocalFolder(installDir);
        console.log('added zip');
        const installDirAsFileName = installDir
            .replaceAll(path.sep, '-')
            .replaceAll(path.posix.sep, '-')
            .replaceAll(' ', '')
            .replaceAll(':', '')
            .replaceAll('(', '')
            .replaceAll(')', '');
        const now = new Date();
        const timestamp =
            now.getFullYear() +
            '-' +
            String(now.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(now.getDate()).padStart(2, '0') +
            '_' +
            String(now.getHours()).padStart(2, '0') +
            '-' +
            String(now.getMinutes()).padStart(2, '0') +
            '-' +
            String(now.getSeconds()).padStart(2, '0');

        // Use the custom backup name if provided
        const fileName = backupName
            ? `${backupName.replace(/[\\/:*?"<>|]/g, '_')}.zip`
            : `${installDirAsFileName}_${timestamp}.zip`;

        const backupFilePath = path.join(DEFAULT_BACKUPS_FOLDER, fileName);
        console.log('writing zip to: ', backupFilePath);
        zip.writeZip(backupFilePath);
        console.log('wrote zip to: ', backupFilePath);
    } catch (err) {
        console.error(
            `An error occurred while creating a zip file for a backup: ${err}`
        );
    }
};
