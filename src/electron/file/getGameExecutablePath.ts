import os from 'os';
import path from 'path';

/**
 * Gets the platform-specific path to the CTP2 executable
 * @param installDir The installation directory path
 * @returns The full path to the game executable
 */
export const getCtp2ExecutablePath = (installDir: string): string => {
    const platform = os.platform();

    // Build the relative path based on platform
    if (platform === 'win32') {
        // Windows uses backslashes and .exe extension
        return path.join(installDir, 'ctp2_program', 'ctp', 'ctp2.exe');
    } else if (platform === 'darwin') {
        // macOS
        return path.join(installDir, 'ctp2_program', 'ctp', 'ctp2');
    } else {
        // Linux and other Unix-like systems
        return path.join(installDir, 'ctp2_program', 'ctp', 'ctp2');
    }
};
