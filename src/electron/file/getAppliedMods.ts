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
                console.log('data: ', modsJson);
                if (Array.isArray(modsJson.appliedMods)) {
                    console.log('return mods json: ', modsJson);
                    return modsJson.appliedMods.map(
                        // eslint-disable-next-line functional/prefer-immutable-types
                        (mod: { appliedDate: string; name: string }) => mod.name
                    );
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
