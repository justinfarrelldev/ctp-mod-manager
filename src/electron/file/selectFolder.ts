import { BrowserWindow, dialog } from 'electron';

export const selectFolder = async (window: BrowserWindow) => {
  const result = await dialog.showOpenDialog(window, {
    properties: ['openDirectory'],
  });

  return result.filePaths[0];
};
