import { app } from 'electron';
import { DEFAULT_MOD_DIR, DEFAULT_MOD_FOLDER_NAME } from '../constants';
import fs from 'fs';
import AdmZip from 'adm-zip';

const unzipInModDir = (zipFullPath: string): void => {
  try {
    const zip = new AdmZip(zipFullPath);
    zip.extractAllTo(DEFAULT_MOD_DIR);
  } catch (err) {
    console.error(`Failed to unzip: ${err}`);
  }
};

// Copy file to mod dir should:
// - Extract the files of the zip to the mods folder (preserve original)
// - Determine if that is a zip (unzip if it is, and repeat until there is not a zip)
// - Determine if this is a scenario file or a full-on mod (does it have scen0000? Is there a ctp2_data or ctp2_program?)
// - If scenario, simply say this does not support scenarios at the moment and will in a later release
// - If it has a ctp2_data / ctp2_program folder, set that as the top-level and zip it (later, I should really add the readme to this level too...)
// - Use that zip in the mod folder (so we can have comparisons of each file easily)
export const copyFileToModDir = async (fileDir: string) => {
  const split = fileDir.split('\\');
  const fileName = split[split.length - 1];
  let stats: fs.Stats | undefined;
  try {
    stats = fs.statSync(DEFAULT_MOD_DIR);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `An error occurred while getting the stats for the directory ${DEFAULT_MOD_DIR}: ${err}`
    );
    createAppDataFolder(DEFAULT_MOD_FOLDER_NAME);
  }

  if (stats) {
    if (!stats.isDirectory()) createAppDataFolder(DEFAULT_MOD_FOLDER_NAME);
  }

  const destination = `${DEFAULT_MOD_DIR}\\${fileName}`;
  unzipInModDir(fileDir);
  fs.copyFile(fileDir, destination, (err) => {
    if (err) throw err;
    // eslint-disable-next-line no-console
    console.log(`Finished copying file from ${fileDir} to ${destination}`);
  });
};

const createAppDataFolder = async (name: string) => {
  let folderPath;
  try {
    folderPath = `${app.getPath('appData')}\\${app.getName()}\\${name}`;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while getting the app path to the AppData folder: ${err}`);
    throw err;
  }

  fs.mkdir(folderPath, (err) => {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while creating a directory within the AppData folder: ${err}`);
    if (err) throw err;
  });
};
