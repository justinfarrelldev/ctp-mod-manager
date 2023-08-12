import * as fs from 'fs';
import { DEFAULT_INSTALLS_DIR, DEFAULT_INSTALLS_FOLDER_NAME } from '../constants';
import { createAppDataFolder } from './copyFileToModDir';

const makeDirDefaultArray = (dir: string) => {
  try {
    return JSON.stringify([dir]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `An error occurred while stringifying JSON into a default array for the directory ${dir}: ${err}`
    );
  }
};

export const addToInstallDirs = async (dir: string) => {
  let stats: fs.Stats | undefined;
  try {
    stats = fs.statSync(DEFAULT_INSTALLS_DIR);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `An error occurred while getting the stats for the directory ${DEFAULT_INSTALLS_DIR}: ${err}`
    );
    await createAppDataFolder(DEFAULT_INSTALLS_FOLDER_NAME);
  }

  if (stats) {
    if (!stats.isDirectory()) await createAppDataFolder(DEFAULT_INSTALLS_FOLDER_NAME);
  }

  const filePath = `${DEFAULT_INSTALLS_DIR}\\installations.json`;
  // Installs dir definitely exists, so we can add the file to it if it does not exist
  let statsOfFile: fs.Stats | undefined;
  try {
    statsOfFile = fs.statSync(filePath);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while getting the stats for the file ${filePath}: ${err}`);
    try {
      fs.writeFileSync(filePath, makeDirDefaultArray(dir));
      return;
    } catch (fileWriteErr) {
      // eslint-disable-next-line no-console
      console.error(
        `An error occurred while writing "[]" to the file ${filePath}: ${fileWriteErr}`
      );
    }
  }

  if (statsOfFile) {
    if (!statsOfFile.isFile()) {
      try {
        fs.writeFileSync(filePath, makeDirDefaultArray(dir));
        return;
      } catch (fileWriteErr) {
        // eslint-disable-next-line no-console
        console.error(
          `An error occurred while writing "[]" to the file ${filePath}: ${fileWriteErr}`
        );
      }
    }
  }

  let contents;
  try {
    contents = fs.readFileSync(filePath).toString();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while reading the file ${filePath}: ${err}`);
  }

  let jsonFile;
  try {
    jsonFile = JSON.parse(contents);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while converting the file contents to JSON: ${err}`);
  }

  try {
    const newArr = [...jsonFile, dir];
    jsonFile = newArr;
    const dataToPush = JSON.stringify(jsonFile);
    fs.writeFileSync(filePath, dataToPush);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error occurred while writing the new data to the file ${filePath}: ${err}`);
  }
};
