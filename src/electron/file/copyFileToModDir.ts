import { app } from 'electron';
import { DEFAULT_MOD_DIR, DEFAULT_MOD_FOLDER_NAME } from '../constants';
import fs from 'fs';

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
