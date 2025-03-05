import * as fs from 'fs';
import { ReadonlyDeep } from 'type-fest';

import { DEFAULT_MOD_DIR } from '../constants';
import { applyFileChanges, ModFileChanges } from './applyFileChanges';
import {
    consolidateLineChangeGroups,
    getFileChangesToApplyMod,
} from './getFileChangesToApplyMod';
import { isValidInstall } from './isValidInstall';

/**
 * Applies the queued mods to the specified installation directory.
 * @param installDir - The directory of the installation where mods will be applied.
 * @param queuedMods - An array of mod names to be applied in order.
 * This function first checks if the provided installation directory is valid.
 * If not, it logs an error and returns. Then, it iterates over the queued mods,
 * checks if each mod is a directory, and copies its contents to the installation directory.
 * If any errors occur during the process, they are logged to the console.
 * @throws Will log an error if the installation directory is invalid.
 * @throws Will log an error if a mod is not a directory.
 * @throws Will log an error if there is an issue copying the mod directory.
 */
export const applyModsToInstall = async (
    installDir: Readonly<string>,
    queuedMods: ReadonlyDeep<string[]>
): Promise<void> => {
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
            return;
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
                fileChanges: changes,
                mod,
            });
            console.log(`${changes.length} changes found for the mod ${mod}.`);
        } catch (err) {
            console.error(
                `An error occurred within applying mods to install while copying the directory ${`${DEFAULT_MOD_DIR}\\${mod}`} to ${DEFAULT_MOD_DIR}: ${err}`
            );
        }
    }

    console.log('Consolidating changes for all mods...');

    // First consolidate line change groups within each file change object
    changesArr = changesArr.map((modFileChange) => {
        const consolidatedFileChanges = modFileChange.fileChanges.map(
            (fileChange) => {
                if ('lineChangeGroups' in fileChange) {
                    fileChange.lineChangeGroups = consolidateLineChangeGroups(
                        fileChange.lineChangeGroups
                    );
                }
                return fileChange;
            }
        );

        return {
            ...modFileChange,
            fileChanges: consolidatedFileChanges,
        };
    });

    console.log(
        'Line changes consolidated within each file change object. Starting merge of changes that target the same file...'
    );

    // Merge file change objects that target the same file, minimizing allocations and repeated operations
    changesArr = changesArr.map((modFileChange) => {
        const merged: Record<
            string,
            (typeof modFileChange.fileChanges)[number]
        > = Object.create(null);

        for (let i = 0; i < modFileChange.fileChanges.length; i++) {
            const fc = modFileChange.fileChanges[i];
            const existing = merged[fc.fileName];
            if (!existing) {
                merged[fc.fileName] = fc;
            } else if (
                'lineChangeGroups' in fc &&
                'lineChangeGroups' in existing
            ) {
                existing.lineChangeGroups.push(...fc.lineChangeGroups);
            }
        }

        for (const filename in merged) {
            const fc = merged[filename];
            if ('lineChangeGroups' in fc) {
                fc.lineChangeGroups = consolidateLineChangeGroups(
                    fc.lineChangeGroups
                );
            }
        }

        return {
            ...modFileChange,
            fileChanges: Object.values(merged),
        };
    });

    console.log(
        `Changes merged. Now have ${changesArr.reduce((prev, curr) => prev + curr.fileChanges.length, 0)} remaining changes. Applying...`
    );

    applyFileChanges({ installDir, modFileChanges: changesArr });

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
