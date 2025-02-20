import { DEFAULT_MOD_DIR } from '../constants';
import { applyFileChanges, ModFileChanges } from './applyFileChanges';
import { getFileChangesToApplyMod } from './getFileChangesToApplyMod';
import { isValidInstall } from './isValidInstall';
import * as fs from 'fs';

/**
 * Applies the queued mods to the specified installation directory.
 *
 * @param installDir - The directory of the installation where mods will be applied.
 * @param queuedMods - An array of mod names to be applied in order.
 *
 * @remarks
 * This function first checks if the provided installation directory is valid.
 * If not, it logs an error and returns. Then, it iterates over the queued mods,
 * checks if each mod is a directory, and copies its contents to the installation directory.
 * If any errors occur during the process, they are logged to the console.
 *
 * @throws Will log an error if the installation directory is invalid.
 * @throws Will log an error if a mod is not a directory.
 * @throws Will log an error if there is an issue copying the mod directory.
 */
export const applyModsToInstall = async (
    installDir: string,
    queuedMods: string[]
) => {
    if (!isValidInstall(installDir)) {
        console.error(
            `Invalid install passed to applyModsToInstall! Install passed: ${installDir}`
        );
        return;
    }

    let changesArr: ModFileChanges[] = [];

    // apply mods in order
    for await (const mod of queuedMods) {
        // Move the mod contents overtop the install and overwrite all files which occur in both

        let statsOfFile: fs.Stats | undefined;
        try {
            statsOfFile = fs.statSync(`${DEFAULT_MOD_DIR}\\${mod}`);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(
                `An error occurred while getting the stats for the file ${`${DEFAULT_MOD_DIR}\\${mod}`}: ${err}`
            );
        }

        if (statsOfFile) {
            if (!statsOfFile.isDirectory()) {
                console.error(
                    `Error: ${`${DEFAULT_MOD_DIR}\\${mod}`} is not a directory.`
                );
                return;
            }
        }

        try {
            console.log(
                `copying ${DEFAULT_MOD_DIR}\\${mod} to the installation at ${installDir}`
            );
            // fs.cpSync(`${DEFAULT_MOD_DIR}\\${mod}`, `${installDir}`, {
            //     recursive: true,
            // });

            const changes = await getFileChangesToApplyMod(mod, installDir); // TODO make this a Promise.allSettled call

            changesArr.push({
                mod,
                fileChanges: changes,
            });
        } catch (err) {
            console.error(
                `An error occurred while copying the directory ${`${DEFAULT_MOD_DIR}\\${mod}`} to ${DEFAULT_MOD_DIR}: ${err}`
            );
        }
    }

    console.log(
        `${changesArr.length} changes found for all ${queuedMods.length} mods. Applying changes...`
    );

    applyFileChanges({ modFileChanges: changesArr, installDir });

    // console.log(
    //     changesArr
    //         .map(
    //             (change) =>
    //                 `Mod: ${change.mod}\nFile Changes:\n${change.fileChanges.join(
    //                     '\n'
    //                 )}`
    //         )
    //         .join('\n\n')
    // );
};
