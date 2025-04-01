import * as fs from 'fs';
import * as path from 'path';

/**
 * Gets the names of mods applied to a specific installation directory
 * @param installDir The installation directory to check
 * @returns An array of mod names that have been applied to the installation
 */
export const getAppliedMods = (installDir: string): string[] => {
    const modsJsonPath = path.join(installDir, 'mods.json');
    console.log('thinks mod json path is: ', modsJsonPath);
    try {
        if (fs.existsSync(modsJsonPath)) {
            const modsData = fs.readFileSync(modsJsonPath, 'utf-8');
            try {
                const modsJson = JSON.parse(modsData);
                if (Array.isArray(modsJson)) {
                    return modsJson;
                }
                return [];
            } catch (err) {
                console.error(`Error parsing mods.json: ${err}`);
                return [];
            }
        }
        return [];
    } catch (err) {
        console.error(`Error reading mods.json: ${err}`);
        return [];
    }
};
