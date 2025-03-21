import * as fs from 'fs';
import * as path from 'path';

import { DEFAULT_BACKUPS_FOLDER } from '../constants';

/**
 * Deletes a backup file from the backups folder.
 * @param backupPath - The name of the backup file to delete.
 * @returns A promise that resolves when the backup is deleted.
 * @throws Will log an error message if the backup file cannot be deleted.
 */
export const deleteBackup = async (backupPath: string): Promise<void> => {
    try {
        const fullPath = backupPath;
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Successfully deleted backup: ${backupPath}`);
        } else {
            console.error(`Backup file not found: ${fullPath}`);
        }
    } catch (err) {
        console.error(`An error occurred while deleting backup: ${err}`);
        throw err;
    }
};
