import fs from 'fs';

export type CtpVersion = 'CTP1' | 'CTP2' | 'Unknown';

/**
 * Detects whether an installation directory contains CTP1 or CTP2
 * @param installDir The installation directory path
 * @returns Promise resolving to 'CTP1', 'CTP2', or 'Unknown'
 */
export const detectCtpVersion = async (
    installDir: string
): Promise<CtpVersion> => {
    try {
        const contents = fs.readdirSync(installDir);
        const lowerCaseContents = contents.map((item) => item.toLowerCase());

        // Check for CTP2 data directory first (prioritize CTP2 if both exist)
        if (lowerCaseContents.includes('ctp2_data')) {
            return 'CTP2';
        }

        // Check for CTP1 data directory
        if (lowerCaseContents.includes('ctp_data')) {
            return 'CTP1';
        }

        return 'Unknown';
    } catch (error) {
        // Handle any file system errors gracefully
        return 'Unknown';
    }
};
