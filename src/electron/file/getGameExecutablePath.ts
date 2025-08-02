import fs from 'fs';
import os from 'os';

import { getGameExecutablePath } from './ctpVariants';

/**
 * Gets the platform-specific path to the CTP executable (CTP1 or CTP2)
 * @param installDir The installation directory path
 * @returns The first found full path to the game executable, or empty string if not found
 */
export const getCtp2ExecutablePath = (installDir: string): string => {
    const platform = os.platform();
    const possiblePaths = getGameExecutablePath(installDir, platform);
    for (const exePath of possiblePaths) {
        try {
            if (fs.existsSync(exePath)) {
                return exePath;
            }
        } catch (e) {
            // ignore
        }
    }
    // fallback to first possible path (for legacy behavior)
    return possiblePaths[0] || '';
};
