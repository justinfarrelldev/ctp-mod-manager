import * as fs from 'fs';
import * as path from 'path';
import { ReadonlyDeep } from 'type-fest';

import { DEFAULT_MOD_DIR } from '../constants';
import { applyFileChanges, ModFileChanges } from './applyFileChanges';
import {
    consolidateLineChangeGroups,
    getFileChangesToApplyMod,
} from './getFileChangesToApplyMod';
import { isValidInstall } from './isValidInstall';

// Define interface for the mod tracking data
interface AppliedMod {
    appliedDate: string;
    name: string;
}

interface ModsTrackingFile {
    appliedMods: AppliedMod[];
}

/**
 * Updates the mods.json tracking file in the installation directory
 * @param installDir - The installation directory path
 * @param modsToAdd - Array of mod names to add to the tracking file
 */
const updateModsTrackingFile = (
    installDir: string,
    modsToAdd: ReadonlyDeep<string[]>
): void => {
    const modsFilePath = path.join(installDir, 'mods.json');
    let modsData: ModsTrackingFile = { appliedMods: [] };

    // Check if mods.json already exists
    if (fs.existsSync(modsFilePath)) {
        try {
            const fileContent = fs.readFileSync(modsFilePath, 'utf-8');
            modsData = JSON.parse(fileContent) as ModsTrackingFile;
            if (!modsData.appliedMods) {
                modsData.appliedMods = [];
            }
        } catch (err) {
            console.error(`Error reading existing mods.json: ${err}`);
            // If file is corrupted, start with a fresh tracking file
            modsData = { appliedMods: [] };
        }
    }

    // Current timestamp for all newly added mods
    const currentTimestamp = new Date().toISOString();

    // Add new mods with timestamps
    const existingModNames = new Set(
        modsData.appliedMods.map((mod) => mod.name)
    );
    for (const mod of modsToAdd) {
        if (!existingModNames.has(mod)) {
            modsData.appliedMods.push({
                appliedDate: currentTimestamp,
                name: mod,
            });
        }
    }

    // Write updated data back to the file
    try {
        fs.writeFileSync(
            modsFilePath,
            JSON.stringify(modsData, null, 2),
            'utf-8'
        );
        console.log(`Updated mods tracking file at ${modsFilePath}`);
    } catch (err) {
        console.error(`Failed to write mods tracking file: ${err}`);

        // Check if this is a permission error
        if (err instanceof Error && err.message.includes('EPERM')) {
            const isWindowsProgramFiles = installDir
                .toLowerCase()
                .includes('program files');
            const errorMessage = isWindowsProgramFiles
                ? `Permission denied: Cannot write mods tracking file to "${installDir}". This appears to be a Windows Program Files directory which requires administrator privileges. The mod files may have been copied, but tracking information couldn't be saved.`
                : `Permission denied: Cannot write mods tracking file to "${installDir}". Please check that you have write permissions to this location.`;

            // TODO: Show this error message to the user in the UI
            console.error(`PERMISSION ERROR (tracking file): ${errorMessage}`);
        }
    }
};

/**
 * Checks if the directory or any of its subdirectories has a scenario structure.
 * A scenario structure is identified by the presence of a 'scen0000' directory
 * containing a 'scenario.txt' file.
 * @param dir - The directory to check
 * @returns true if the directory or any subdirectory has a scenario structure
 */
export const hasScenarioStructure = (dir: string): boolean => {
    try {
        // Direct check for the current directory
        if (
            fs.existsSync(path.join(dir, 'scen0000')) &&
            fs.existsSync(path.join(dir, 'scen0000', 'scenario.txt'))
        ) {
            return true;
        }

        // Recursive check for subdirectories
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subDirPath = path.join(dir, entry.name);
                if (hasScenarioStructure(subDirPath)) {
                    return true;
                }
            }
        }

        return false;
    } catch (err) {
        console.error(`Error checking for scenario structure: ${err}`);
        return false;
    }
};

export const applyModsToInstall = async (
    installDir: Readonly<string>,
    queuedMods: ReadonlyDeep<string[]>
): Promise<void> => {
    console.log(
        `Starting applyModsToInstall with installDir: ${installDir}, queuedMods: ${JSON.stringify(queuedMods)}`
    );

    if (!(await isValidInstall(installDir))) {
        console.error(
            `Invalid install passed to applyModsToInstall! Install passed: ${installDir}`
        );
        return;
    }

    console.log(`Install directory is valid: ${installDir}`);

    // Loop through mods and copy each one into the install dir, overwriting
    for await (const mod of queuedMods) {
        console.log(`Processing mod: ${mod}`);
        // modPath is where the mod was extracted in our mods folder.
        const modPath = path.join(DEFAULT_MOD_DIR, mod);
        console.log(`Mod path: ${modPath}`);
        let targetDir = installDir; // default for non-scenario mods

        // If this mod is a scenario mod then:
        if (hasScenarioStructure(modPath)) {
            console.log(`Detected scenario structure for mod: ${mod}`);
            // Set target to be in "Scenarios" folder in the install.
            targetDir = path.join(
                installDir,
                'Scenarios',
                path.basename(modPath)
            );
        } else {
            console.log(`No scenario structure detected for mod: ${mod}`);
        }

        let statsOfFile: fs.Stats | undefined;
        try {
            statsOfFile = fs.statSync(modPath);
            console.log(`Successfully got stats for mod path: ${modPath}`);
        } catch (err) {
            console.error(
                `An error occurred while getting the stats for ${modPath}: ${err}`
            );
            return;
        }

        if (statsOfFile && !statsOfFile.isDirectory()) {
            console.error(`Error: ${modPath} is not a directory.`);
            return;
        }

        console.log(`Mod path is a valid directory: ${modPath}`);

        try {
            console.log(`Copying ${modPath} to installation at ${targetDir}`);
            fs.cpSync(modPath, targetDir, {
                force: true,
                recursive: true,
            });
            console.log(`Successfully copied ${modPath} to ${targetDir}`);
        } catch (err) {
            console.error(`Error copying ${modPath} to ${targetDir}: ${err}`);

            // Check if this is a permission error
            if (err instanceof Error && err.message.includes('EPERM')) {
                const isWindowsProgramFiles = targetDir
                    .toLowerCase()
                    .includes('program files');
                const errorMessage = isWindowsProgramFiles
                    ? `Permission denied: Cannot write to "${targetDir}". This appears to be a Windows Program Files directory which requires administrator privileges. Please either:\n\n1. Run the CTP Mod Manager as Administrator, or\n2. Install Call to Power to a different location (like C:\\Games\\CallToPower) that doesn't require admin rights\n\nAlternatively, you can manually copy the mod files from:\n"${modPath}"\nto:\n"${targetDir}"`
                    : `Permission denied: Cannot write to "${targetDir}". Please check that:\n\n1. The directory is not read-only\n2. No files in the directory are currently in use\n3. You have write permissions to this location\n\nYou may need to run the application as Administrator if the installation is in a protected system directory.`;

                // TODO: Show this error message to the user in the UI
                console.error(`PERMISSION ERROR: ${errorMessage}`);

                // For now, continue with other mods instead of stopping completely
                continue;
            }

            // For non-permission errors, continue but log the error
            continue;
        }
    }

    // After applying all mods, write the mod list to mods.json
    try {
        const modsJsonPath = path.join(installDir, 'mods.json');
        fs.writeFileSync(modsJsonPath, JSON.stringify(queuedMods));
    } catch (err) {
        console.error(`Error writing mods.json: ${err}`);

        // Check if this is a permission error
        if (err instanceof Error && err.message.includes('EPERM')) {
            const isWindowsProgramFiles = installDir
                .toLowerCase()
                .includes('program files');
            const errorMessage = isWindowsProgramFiles
                ? `Permission denied: Cannot write mods.json tracking file to "${installDir}". This appears to be a Windows Program Files directory which requires administrator privileges. The mod files may have been partially copied, but tracking information couldn't be saved.`
                : `Permission denied: Cannot write mods.json tracking file to "${installDir}". Please check that you have write permissions to this location.`;

            // TODO: Show this error message to the user in the UI
            console.error(`PERMISSION ERROR (mods.json): ${errorMessage}`);
        }
    }

    // After all mods have been applied, update the tracking file
    updateModsTrackingFile(installDir, [...queuedMods]);

    console.log('All mods copied to the install directory.');
};

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
export const applyModsToInstallWithMerge = async (
    installDir: Readonly<string>,
    queuedMods: ReadonlyDeep<string[]>
): Promise<void> => {
    if (!(await isValidInstall(installDir))) {
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
        const consolidatedFileChanges = Array.isArray(modFileChange.fileChanges)
            ? modFileChange.fileChanges.map((fileChange) => {
                  if (
                      fileChange &&
                      'lineChangeGroups' in fileChange &&
                      Array.isArray(fileChange.lineChangeGroups)
                  ) {
                      fileChange.lineChangeGroups = consolidateLineChangeGroups(
                          fileChange.lineChangeGroups
                      );
                  }
                  return fileChange;
              })
            : [];
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

    // After all mods have been applied, update the tracking file
    updateModsTrackingFile(installDir, [...queuedMods]);

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
