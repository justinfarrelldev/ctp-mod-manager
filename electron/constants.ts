import { app } from 'electron';
let DEFAULT_MOD_DIR: string;
try {
  DEFAULT_MOD_DIR = `${app.getPath('appData')}\\Call to Power Mod Manager\\Mods`;
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(`An error has occurred getting the appData path: ${err}`);
}

export { DEFAULT_MOD_DIR };
