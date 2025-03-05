import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

/**
 * Restores a backup to the specified installation directory
 * @param backupPath - Path to the backup zip file
 * @param installDir - The directory where the backup will be restored
 * @returns A promise that resolves when the backup is restored
 */
export const restoreBackup = async (
    backupPath: string,
    installDir: string
): Promise<void> => {
    try {
        console.log(
            `Starting backup restoration from ${backupPath} to ${installDir}`
        );

        // First, make sure the install directory exists
        if (!fs.existsSync(installDir)) {
            fs.mkdirSync(installDir, { recursive: true });
        } else {
            // Clean the installation directory before restoring
            console.log(`Cleaning installation directory: ${installDir}`);
            const files = fs.readdirSync(installDir);
            for (const file of files) {
                const filePath = path.join(installDir, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    // Skip certain directories if needed
                    if (['logs', 'saves'].includes(file)) {
                        console.log(`Skipping directory: ${file}`);
                        continue;
                    }
                    fs.rmSync(filePath, { force: true, recursive: true });
                } else {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Extract the backup to the installation directory
        const zip = new AdmZip(backupPath);
        console.log(`Extracting backup to ${installDir}`);
        zip.extractAllTo(installDir, true);
        console.log('Backup restored successfully');
    } catch (err) {
        console.error(`An error occurred while restoring the backup: ${err}`);
        throw new Error(`Failed to restore backup: ${err.message}`);
    }
};
