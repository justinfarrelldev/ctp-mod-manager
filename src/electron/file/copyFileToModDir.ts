import { app } from 'electron';
import { DEFAULT_MOD_DIR, DEFAULT_MOD_FOLDER_NAME } from '../constants';
import fs from 'fs';
import AdmZip from 'adm-zip';
import klawSync from 'klaw-sync';

const unzipInModDir = async (zipFullPath: string, fileName: string): Promise<void> => {
  const fileFolder = fileName.replace('.zip', '');
  return new Promise((resolve) => {
    try {
      const zip = new AdmZip(zipFullPath);
      zip.extractAllToAsync(`${DEFAULT_MOD_DIR}\\${fileFolder}`, false, false, (err) => {
        if (err) {
          console.error(`An error occurred while extracting ${zipFullPath}: ${err}`);
        }
        resolve();
      });
    } catch (err) {
      console.error(`Failed to unzip: ${err}`);
      resolve();
    }
  });
};

const findZipFilesInDir = (dir: string): string[] => {
  try {
    return klawSync(dir)
      .filter((files) => files.path.endsWith('.zip'))
      .map((item) => item.path);
  } catch (err) {
    console.error(`An error occurred while searching for zip files: ${err}`);
  }
};

const extract = (zip: AdmZip, targetPath: string): Promise<void> => {
  return new Promise((resolve) => {
    zip.extractAllToAsync(targetPath, false, false, (err) => {
      if (err) console.error(`An error occurred while extracting to ${targetPath}: ${err}`);

      resolve();
    });
  });
};

const unzipAllFiles = async (destination: string): Promise<void> => {
  // Search through every folder for zip files, extracting as it finds them
  // If it does not find them, it quits with success and moves on to the next step of the process
  let zipFilesInDirs = findZipFilesInDir(destination.replace('.zip', ''));

  while (zipFilesInDirs.length > 0) {
    for (const file of zipFilesInDirs) {
      const splitFile = file.split('\\');
      const name = splitFile[splitFile.length - 1];

      const zipFile = new AdmZip(file);
      // eslint-disable-next-line no-await-in-loop
      await extract(zipFile, file.replace(name, ''));
      fs.rmSync(file);
      // eslint-disable-next-line no-await-in-loop
      zipFilesInDirs = await findZipFilesInDir(destination.replace('.zip', ''));
    }
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
    await createAppDataFolder(DEFAULT_MOD_FOLDER_NAME);
  }

  if (stats) {
    if (!stats.isDirectory()) await createAppDataFolder(DEFAULT_MOD_FOLDER_NAME);
  }

  const destination = `${DEFAULT_MOD_DIR}\\${fileName}`;
  await unzipInModDir(fileDir, fileName);

  await unzipAllFiles(destination);
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
