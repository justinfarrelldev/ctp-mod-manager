import * as fs from 'fs';
import * as path from 'path';

// Types to handle both old and new formats
interface AppliedMod {
    appliedDate?: string;
    name: string;
}

interface ModsTrackingFile {
    appliedMods: AppliedMod[];
}

/**
 * Gets the names of mods applied to a specific installation directory
 * Handles both legacy format (string[]) and new format ({ appliedMods: AppliedMod[] })
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

                // Handle legacy format (array of strings)
                if (Array.isArray(modsJson)) {
                    return modsJson;
                }

                // Handle new format (object with appliedMods array)
                if (
                    modsJson &&
                    typeof modsJson === 'object' &&
                    'appliedMods' in modsJson
                ) {
                    const trackingFile = modsJson as ModsTrackingFile;
                    if (Array.isArray(trackingFile.appliedMods)) {
                        return trackingFile.appliedMods
                            .filter(
                                (mod) => mod && typeof mod.name === 'string'
                            )
                            .map((mod) => mod.name);
                    }
                }

                // Unknown format, return empty array
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
