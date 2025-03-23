/* eslint-disable no-case-declarations */
// The above eslint rule is disabled because it is okay in this case
import { Draft } from 'immer';

import { InstallDirectory } from './App';

// Define action types
export type AppAction =
    | { payload: boolean; type: 'SET_APPLYING_MODS' }
    | { payload: boolean; type: 'SET_BACKUP_RESTORE_OPEN' }
    | { payload: boolean; type: 'SET_DELETE_BACKUP_OPEN' }
    | { payload: boolean; type: 'SET_INSTALL_DIR_MODAL_OPEN' }
    | { payload: boolean; type: 'SET_LOADING_DIRS' }
    | { payload: boolean; type: 'SET_LOADING_MODS' }
    | { payload: boolean; type: 'SET_SETTINGS_OPEN' }
    | { payload: boolean; type: 'SET_SHOW_ALPHA_WARNING' }
    | { payload: InstallDirectory[]; type: 'ADD_TO_INSTALL_DIRS' }
    | { payload: InstallDirectory[]; type: 'SET_INSTALL_DIRS' }
    | { payload: number; type: 'TOGGLE_SELECTED_INSTALLATION' }
    | { payload: string; type: 'DEQUEUE_MOD' }
    | { payload: string; type: 'QUEUE_MOD' }
    | { payload: string; type: 'SET_BACKUP_INSTALL_DIR' }
    | { payload: string; type: 'SET_CREATING_BACKUP' }
    | { payload: string; type: 'SET_DELETING_BACKUP_DIR' }
    | { payload: string; type: 'SET_DIR_BEING_MODIFIED' }
    | { payload: string; type: 'TOGGLE_CHECKED_MOD' }
    | { payload: string[]; type: 'SET_MOD_NAMES_QUEUED' }
    | { payload: string[] | undefined; type: 'SET_MOD_NAMES_ADDED' }
    | { payload: string | undefined; type: 'SET_ERROR' };

// Define state interface
export interface AppState {
    applyingMods: boolean;
    backupInstallDir: string;
    backupRestoreOpen: boolean;
    checkedMods: string[];
    creatingBackup: string;
    deleteBackupOpen: boolean;
    deletingBackupDir: string;
    dirBeingModified: string;
    error: string | undefined;
    installDirModalOpen: boolean;
    installDirs: InstallDirectory[];
    loadingDirs: boolean;
    loadingMods: boolean;
    modNamesAdded: string[] | undefined;
    modNamesQueued: string[];
    selectedInstallations: number[];
    settingsOpen: boolean;
    showAlphaWarning: boolean;
}

// Define initial state
export const initialState: AppState = {
    applyingMods: false,
    backupInstallDir: '',
    backupRestoreOpen: false,
    checkedMods: [],
    creatingBackup: '',
    deleteBackupOpen: false,
    deletingBackupDir: '',
    dirBeingModified: '',
    error: undefined,
    installDirModalOpen: false,
    installDirs: [],
    loadingDirs: false,
    loadingMods: false,
    modNamesAdded: undefined,
    modNamesQueued: [],
    selectedInstallations: [],
    settingsOpen: false,
    showAlphaWarning: true,
};

// Create the reducer function
export const appReducer = (
    // This is the way that Immer works
    // eslint-disable-next-line functional/prefer-immutable-types
    draft: Draft<AppState>,
    // eslint-disable-next-line functional/prefer-immutable-types
    action: AppAction
): void => {
    switch (action.type) {
        case 'ADD_TO_INSTALL_DIRS':
            draft.installDirs.push(...action.payload);
            break;
        case 'DEQUEUE_MOD':
            if (draft.modNamesAdded) {
                draft.modNamesQueued = draft.modNamesQueued.filter(
                    (mod) => mod !== action.payload
                );
                draft.modNamesAdded.push(action.payload);
            }
            break;
        case 'QUEUE_MOD':
            if (draft.modNamesAdded) {
                draft.modNamesQueued.push(action.payload);
                draft.modNamesAdded = draft.modNamesAdded.filter(
                    (mod) => mod !== action.payload
                );
            }
            break;
        case 'SET_APPLYING_MODS':
            draft.applyingMods = action.payload;
            break;
        case 'SET_BACKUP_INSTALL_DIR':
            draft.backupInstallDir = action.payload;
            break;
        case 'SET_BACKUP_RESTORE_OPEN':
            draft.backupRestoreOpen = action.payload;
            break;
        case 'SET_CREATING_BACKUP':
            draft.creatingBackup = action.payload;
            break;
        case 'SET_DELETE_BACKUP_OPEN':
            draft.deleteBackupOpen = action.payload;
            break;
        case 'SET_DELETING_BACKUP_DIR':
            draft.deletingBackupDir = action.payload;
            break;
        case 'SET_DIR_BEING_MODIFIED':
            draft.dirBeingModified = action.payload;
            break;
        case 'SET_ERROR':
            draft.error = action.payload;
            break;
        case 'SET_INSTALL_DIR_MODAL_OPEN':
            draft.installDirModalOpen = action.payload;
            break;
        case 'SET_INSTALL_DIRS':
            draft.installDirs = action.payload;
            break;
        case 'SET_LOADING_DIRS':
            draft.loadingDirs = action.payload;
            break;
        case 'SET_LOADING_MODS':
            draft.loadingMods = action.payload;
            break;
        case 'SET_MOD_NAMES_ADDED':
            draft.modNamesAdded = action.payload;
            break;
        case 'SET_MOD_NAMES_QUEUED':
            draft.modNamesQueued = action.payload;
            break;
        case 'SET_SETTINGS_OPEN':
            draft.settingsOpen = action.payload;
            break;
        case 'SET_SHOW_ALPHA_WARNING':
            draft.showAlphaWarning = action.payload;
            break;
        case 'TOGGLE_CHECKED_MOD':
            const modIndex = draft.checkedMods.indexOf(action.payload);
            if (modIndex === -1) {
                draft.checkedMods.push(action.payload);
            } else {
                draft.checkedMods.splice(modIndex, 1);
            }
            break;
        case 'TOGGLE_SELECTED_INSTALLATION':
            const index = draft.selectedInstallations.indexOf(action.payload);
            if (index === -1) {
                draft.selectedInstallations.push(action.payload);
            } else {
                draft.selectedInstallations.splice(index, 1);
            }
            break;
    }
};
