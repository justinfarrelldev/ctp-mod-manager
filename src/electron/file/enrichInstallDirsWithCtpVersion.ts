import { ReadonlyDeep } from 'type-fest';

import { InstallDirectory } from '../../App';
import { detectCtpVersion } from './detectCtpVersion';

/**
 * Enriches an array of installation directories with CTP version information
 * @param installDirs Array of installation directories to enrich
 * @returns Promise resolving to the same array but with ctpVersion property added
 */
export const enrichInstallDirsWithCtpVersion = async (
    installDirs: ReadonlyDeep<InstallDirectory[]>
): Promise<InstallDirectory[]> => {
    const enrichedDirs = await Promise.all(
        installDirs.map(async (dir) => {
            const ctpVersion = await detectCtpVersion(dir.directory);
            return {
                ...dir,
                ctpVersion,
            };
        })
    );

    return enrichedDirs;
};
