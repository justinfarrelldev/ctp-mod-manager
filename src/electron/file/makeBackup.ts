import * as fs from 'fs';
import {
    DEFAULT_BACKUPS_FOLDER,
    DEFAULT_BACKUPS_FOLDER_NAME,
} from '../constants';
import { createAppDataFolder } from './copyFileToModDir';
import AdmZip from 'adm-zip';

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

export const makeBackup = async (installDir: string): Promise<void> => {
    await selectivelyAddBackupsFolder();
    const zip = new AdmZip();

    try {
        console.log('adding local folder to zip: ', installDir);
        zip.addLocalFolder(installDir);
        console.log('added zip');
        const installDirAsFileName = installDir
            .replaceAll('\\', '-')
            .replaceAll(' ', '')
            .replaceAll(':', '')
            .replaceAll('(', '')
            .replaceAll(')', '');
        console.log(
            'writing zip to: ',
            `${DEFAULT_BACKUPS_FOLDER}\\${installDirAsFileName}.zip`
        );
        zip.writeZip(`${DEFAULT_BACKUPS_FOLDER}\\${installDirAsFileName}.zip`);
        console.log('wrote zip there...');
    } catch (err) {
        console.error(
            `An error occurred while creating a zip file for a backup: ${err}`
        );
    }
};
