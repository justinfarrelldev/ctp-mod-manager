import { app } from 'electron';

export const DEFAULT_MOD_FOLDER_NAME = 'Mods';
let DEFAULT_MOD_DIR: string;
try {
  DEFAULT_MOD_DIR = `${app.getPath('appData')}\\${app.getName()}\\${DEFAULT_MOD_FOLDER_NAME}`;
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(`An error has occurred getting the appData path: ${err}`);
}

export { DEFAULT_MOD_DIR };
