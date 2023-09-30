import { DEFAULT_MOD_DIR } from '../constants';
import { isValidInstall } from './isValidInstall';
import * as fs from 'fs';

export const applyModsToInstall = (installDir: string, queuedMods: string[]) => {
  if (!isValidInstall(installDir)) {
    console.error(`Invalid install passed to applyModsToInstall! Install passed: ${installDir}`);
    return;
  }

  // apply mods in order
  for (const mod of queuedMods) {
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
        console.error(`Error: ${`${DEFAULT_MOD_DIR}\\${mod}`} is not a directory.`);
        return;
      }
    }

    try {
      console.log(`copying ${DEFAULT_MOD_DIR}\\${mod} to the installation at ${installDir}`);
      fs.cpSync(`${DEFAULT_MOD_DIR}\\${mod}`, `${installDir}`, {
        recursive: true,
      });
    } catch (err) {
      console.error(
        `An error occurred while copying the directory ${`${DEFAULT_MOD_DIR}\\${mod}`} to ${DEFAULT_MOD_DIR}: ${err}`
      );
    }
  }
};
