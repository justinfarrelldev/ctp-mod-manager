import { app } from 'electron';
import * as path from 'path';

export const DEFAULT_MOD_FOLDER_NAME = 'Mods';
let DEFAULT_MOD_DIR: string;
try {
    DEFAULT_MOD_DIR = path.join(
        app.getPath('appData'),
        app.getName(),
        DEFAULT_MOD_FOLDER_NAME
    );
} catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred getting the appData path: ${err}`);
}

export const DEFAULT_INSTALLS_FOLDER_NAME = 'Installations';
let DEFAULT_INSTALLS_DIR: string;
try {
    DEFAULT_INSTALLS_DIR = path.join(
        app.getPath('appData'),
        app.getName(),
        DEFAULT_INSTALLS_FOLDER_NAME
    );
    console.log('default installs dir: ', DEFAULT_INSTALLS_DIR);
} catch (err) {
    // eslint-disable-next-line no-console
    console.error(`An error has occurred getting the appData path: ${err}`);
}

export const DEFAULT_INSTALLS_FILE = path.join(
    DEFAULT_INSTALLS_DIR,
    'installations.json'
);

export const DEFAULT_BACKUPS_FOLDER_NAME = 'InstallationBackups';
export const DEFAULT_BACKUPS_FOLDER = path.join(
    app.getPath('appData'),
    app.getName(),
    DEFAULT_BACKUPS_FOLDER_NAME
);

export { DEFAULT_INSTALLS_DIR, DEFAULT_MOD_DIR };
