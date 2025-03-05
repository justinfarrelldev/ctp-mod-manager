import fs from 'fs';
import path from 'path';

import { DEFAULT_BACKUPS_FOLDER } from '../constants';

/**
 * Lists all backup files in the backups folder
 * @returns A promise that resolves to an array of backup file information
 */
export const listBackups = async (): Promise<
    Array<{
        creationDate: Date;
        filename: string;
        path: string;
    }>
> => {
    try {
        // Check if the backups folder exists
        if (!fs.existsSync(DEFAULT_BACKUPS_FOLDER)) {
            return [];
        }

        // Get all files in the backups folder
        const files = fs
            .readdirSync(DEFAULT_BACKUPS_FOLDER)
            .filter((file) => file.endsWith('.zip'));

        // Get file details
        const backupFiles = files.map((filename) => {
            const filePath = path.join(DEFAULT_BACKUPS_FOLDER, filename);
            const stats = fs.statSync(filePath);

            return {
                creationDate: stats.birthtime,
                filename,
                path: filePath,
            };
        });

        // Sort by creation date (newest first)
        return backupFiles.sort(
            (a, b) => b.creationDate.getTime() - a.creationDate.getTime()
        );
    } catch (err) {
        console.error(`An error occurred while listing backup files: ${err}`);
        return [];
    }
};
