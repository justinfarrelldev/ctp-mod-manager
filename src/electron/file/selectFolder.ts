/* eslint-disable functional/prefer-immutable-types */
// The above rule is disabled because Electron relies on it
import { BrowserWindow, dialog } from 'electron';

export const selectFolder = async (window: BrowserWindow): Promise<string> => {
    const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory'],
    });

    return result.filePaths[0];
};
