import React, { FC, useEffect } from 'react';
import { themeChange } from 'theme-change';
import { ReadonlyDeep } from 'type-fest';
import { useImmerReducer } from 'use-immer';

import { appReducer, initialState } from './app-reducer';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { DeleteBackupModal } from './components/DeleteBackupModal';
import { ErrorModal } from './components/ErrorModal';
import { ApplyIcon } from './components/icons/apply';
import { SettingsIcon } from './components/icons/settings';
import { TrashIcon } from './components/icons/trash';
import { InstallDirTable } from './components/InstallDirTable';
import { Modal } from './components/Modal';
import { ModifyInstallView } from './components/ModifyInstallView';
import { Settings as SettingsMenu } from './components/Settings';
import { AUTO_DETECT_INSTALL_TEXT } from './constants';

export type ElectronWindow = typeof globalThis &
    Window & {
        api: {
            addToInstallDirs: (
                ipcCommand: string,
                dir: string
            ) => Promise<void>;
            applyModsToInstall: (
                ipcCommand: 'file:applyModsToInstall',
                installDir: string,
                mods: ReadonlyDeep<string[]>
            ) => Promise<void>;
            copyFileToModDir: (
                ipcCommand: string,
                fileDir: string
            ) => Promise<void>;
            deleteBackup: (
                ipcCommand: 'file:deleteBackup',
                backupPath: string
            ) => Promise<void>;
            getCtp2InstallDir: () => Promise<
                [
                    {
                        directory: string;
                        installationType: 'gog' | 'steam';
                        os: string;
                    },
                ]
            >;
            getInstallDirs: (
                ipcCommand: 'file:getInstallDirs'
            ) => Promise<string[]>;
            getModsDir: (ipcCommand: string) => Promise<string>;
            goToRoute: (ipcCommand: string, route: string) => void;
            isGameRunning: (
                ipcCommand: 'file:isGameRunning',
                exeDir?: string
            ) => Promise<boolean>;
            isValidInstall: (
                ipcCommand: string,
                dir: string
            ) => Promise<boolean>;
            listBackups: () => Promise<
                Array<{
                    creationDate: Date;
                    filename: string;
                    path: string;
                }>
            >;
            loadModFileNames: () => Promise<string[]>;
            makeBackup: (
                ipcCommand: 'file:makeBackup',
                installDir: string
            ) => Promise<void>;
            openDirectory: (ipcCommand: string, dir: string) => void;
            openModsDir: (ipcCommand: string) => void;
            removeFromInstallDirs: (
                ipcCommand: 'file:removeFromInstallDirs',
                dir: string
            ) => Promise<void>;
            removeModFromMods: (
                ipcCommand: string,
                fileDir: string
            ) => Promise<void>;
            restoreBackup: (
                ipcCommand: string,
                backupPath: string,
                installDir: string
            ) => Promise<void>;
            runGame: (ipcCommand: 'file:runGame', exeDir: string) => void;
            selectFolder: (ipcCommand: string) => Promise<string>;
            stopGame: (ipcCommand: 'file:stopGame') => Promise<boolean>;
            viewFileDirsInZip: (
                ipcCommand: string,
                zipFilePath: string
            ) => Promise<string[]>;
        };
    };

export type InstallDirectory = {
    directory: string;
    installationType: 'gog' | 'steam';
    os: string;
};

// Wish there was a way to share this type, but alas... it's also found in electron/file/getFileChangesToApplyMod.tsx
type FileChange = {
    fileName: string;
    lineChangeGroups: LineChangeGroup[];
};

// Wish there was a way to share this type, but alas... it's also found in electron/file/getFileChangesToApplyMod.tsx
type LineChangeGroup = {
    change: string; // The change, including everything between startLineNumber and endLineNumber (including newlines)
    contentBeforeChange: string; // The content before it was replaced by the mod
    endLineNumber: number;
    startLineNumber: number;
};

export const App: FC = (): React.ReactElement => {
    const [state, dispatch] = useImmerReducer(appReducer, initialState);

    const handleRestoreBackupClick = (installDir: string): void => {
        dispatch({ payload: installDir, type: 'SET_BACKUP_INSTALL_DIR' });
        dispatch({ payload: true, type: 'SET_BACKUP_RESTORE_OPEN' });
    };

    const handleCreateBackupClick = async (
        installDir: string
    ): Promise<void> => {
        dispatch({ payload: installDir, type: 'SET_CREATING_BACKUP' });
        try {
            await (window as ElectronWindow).api.makeBackup(
                'file:makeBackup',
                installDir
            );
        } catch (err) {
            console.error(`Failed to create backup: ${err}`);
            dispatch({
                payload: `Failed to create backup: ${err}`,
                type: 'SET_ERROR',
            });
        } finally {
            dispatch({ payload: '', type: 'SET_CREATING_BACKUP' });
        }
    };

    const handleDeleteBackupClick = (installDir: string): void => {
        dispatch({ payload: installDir, type: 'SET_DELETING_BACKUP_DIR' });
        dispatch({ payload: true, type: 'SET_DELETE_BACKUP_OPEN' });
    };

    const loadModFileNames = async (): Promise<void> => {
        dispatch({ payload: true, type: 'SET_LOADING_MODS' });
        try {
            const loadedMods = await (
                window as ElectronWindow
            ).api.loadModFileNames();
            dispatch({ payload: loadedMods, type: 'SET_MOD_NAMES_ADDED' });
        } catch (err) {
            console.error(
                `An error occurred within App while setting mod names: ${err}`
            );
            dispatch({
                payload: `An error occurred while attempting to load mods: ${err}.`,
                type: 'SET_ERROR',
            });
        } finally {
            dispatch({ payload: false, type: 'SET_LOADING_MODS' });
        }
    };

    const loadInstallDirs = async (): Promise<void> => {
        dispatch({ payload: true, type: 'SET_LOADING_DIRS' });
        try {
            const dirsFromFile = await (
                window as ElectronWindow
            ).api.getInstallDirs('file:getInstallDirs');

            const dirs = dirsFromFile.map((dir) => ({
                directory: dir,
                installationType: 'steam' as const,
                os: 'win32' as const,
            }));

            dispatch({ payload: dirs, type: 'SET_INSTALL_DIRS' });

            if (dirsFromFile.length === 0) {
                dispatch({ payload: true, type: 'SET_INSTALL_DIR_MODAL_OPEN' });
            }
        } finally {
            dispatch({ payload: false, type: 'SET_LOADING_DIRS' });
        }
    };

    const findInstallDirs = async (): Promise<void> => {
        dispatch({ payload: true, type: 'SET_LOADING_DIRS' });
        try {
            const dirs: InstallDirectory[] = await (
                window as ElectronWindow
            ).api.getCtp2InstallDir();

            for (const dir of dirs) {
                // For the sake of speed, I am disabling this
                // eslint-disable-next-line no-await-in-loop
                await (window as ElectronWindow).api.addToInstallDirs(
                    'file:addToInstallDirs',
                    dir.directory
                );
            }

            dispatch({ payload: dirs, type: 'ADD_TO_INSTALL_DIRS' });
            await loadModFileNames();
        } finally {
            dispatch({ payload: false, type: 'SET_LOADING_DIRS' });
        }
    };

    const handleInstallDirModalClose = (): void => {
        dispatch({ payload: false, type: 'SET_INSTALL_DIR_MODAL_OPEN' });
    };

    const handleFileSelected = async (
        e: ReadonlyDeep<React.ChangeEvent<HTMLInputElement>>
    ): Promise<void> => {
        dispatch({ payload: true, type: 'SET_LOADING_MODS' });
        try {
            const files = Array.from(e.target.files);
            await (window as ElectronWindow).api.copyFileToModDir(
                'file:copy',
                (files[0] as File & { path: string }).path
            );
            await loadModFileNames();
        } finally {
            dispatch({ payload: false, type: 'SET_LOADING_MODS' });
        }
    };

    const openModsDir = (): void => {
        (window as ElectronWindow).api.openModsDir('file:openModsDir');
    };

    const viewFileDirsInZip = async (
        zipFilePath: string
    ): Promise<string[]> => {
        return await (window as ElectronWindow).api.viewFileDirsInZip(
            'file:viewFileDirsInZip',
            zipFilePath
        );
    };

    const getModsDir = async (): Promise<string> => {
        return await (window as ElectronWindow).api.getModsDir(
            'file:getModsDir'
        );
    };

    useEffect(() => {
        loadModFileNames();
        loadInstallDirs();
        themeChange(false);
        // 👆 false parameter is required for react project
    }, []);

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Add the DeleteBackupModal */}
            <DeleteBackupModal
                installDir={state.deletingBackupDir}
                onClose={(): void =>
                    dispatch({ payload: false, type: 'SET_DELETE_BACKUP_OPEN' })
                }
                open={state.deleteBackupOpen}
            />
            {/* Existing BackupRestoreModal */}
            <BackupRestoreModal
                installDir={state.backupInstallDir}
                onClose={(): void =>
                    dispatch({
                        payload: false,
                        type: 'SET_BACKUP_RESTORE_OPEN',
                    })
                }
                open={state.backupRestoreOpen}
            />

            <header className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold">
                    Call to Power II Mod Manager
                </h1>
                <button
                    aria-label="Open Settings"
                    className="btn btn-ghost btn-circle"
                    onClick={(): void =>
                        dispatch({ payload: true, type: 'SET_SETTINGS_OPEN' })
                    }
                >
                    <SettingsIcon />
                </button>
            </header>

            {state.error && (
                <ErrorModal
                    errorMessage={state.error}
                    onClose={(): void =>
                        dispatch({ payload: undefined, type: 'SET_ERROR' })
                    }
                    open={!!state.error}
                />
            )}

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    Installation Directories
                </h2>

                {state.loadingDirs && (
                    <div className="flex justify-center my-4">
                        <span
                            aria-label="Loading installation directories"
                            className="loading loading-spinner loading-lg"
                        ></span>
                    </div>
                )}

                {state.settingsOpen && (
                    <Modal
                        buttons={[
                            {
                                color: 'neutral',
                                onClick: () =>
                                    dispatch({
                                        payload: false,
                                        type: 'SET_SETTINGS_OPEN',
                                    }),
                                text: 'Close',
                            },
                        ]}
                        modalName="Settings"
                        onClose={(): void =>
                            dispatch({
                                payload: false,
                                type: 'SET_SETTINGS_OPEN',
                            })
                        }
                        open={state.settingsOpen}
                        text=""
                        width="50%"
                    >
                        <SettingsMenu />
                    </Modal>
                )}

                {state.applyingMods && (
                    <Modal
                        buttons={[
                            {
                                color: 'neutral',
                                onClick: () =>
                                    dispatch({
                                        payload: false,
                                        type: 'SET_APPLYING_MODS',
                                    }),
                                text: 'Cancel',
                            },
                        ]}
                        modalName="Applying Mods"
                        onClose={(): void =>
                            dispatch({
                                payload: false,
                                type: 'SET_APPLYING_MODS',
                            })
                        }
                        open={state.applyingMods}
                        text=""
                        width="50%"
                    >
                        <p className="mb-4">
                            Applying mods, please wait (this can take a
                            while)...
                        </p>
                        <div className="flex justify-center">
                            <span
                                aria-label="Applying mods"
                                className="loading loading-bars loading-md"
                            ></span>
                        </div>
                    </Modal>
                )}

                <InstallDirTable
                    creatingBackup={state.creatingBackup}
                    installDirs={state.installDirs}
                    onAddedInstallDirectory={loadInstallDirs}
                    onClickCreateBackup={handleCreateBackupClick}
                    onClickDeleteBackup={handleDeleteBackupClick}
                    onClickModify={(dir): void =>
                        dispatch({
                            payload: dir,
                            type: 'SET_DIR_BEING_MODIFIED',
                        })
                    }
                    onClickRestoreBackup={handleRestoreBackupClick}
                    onSelectInstallation={(index): void => {
                        dispatch({
                            payload: index,
                            type: 'TOGGLE_SELECTED_INSTALLATION',
                        });
                    }}
                />

                <Modal
                    buttons={[
                        {
                            color: 'neutral',
                            onClick: () =>
                                dispatch({
                                    payload: '',
                                    type: 'SET_DIR_BEING_MODIFIED',
                                }),
                            text: 'Close',
                        },
                    ]}
                    height="100%"
                    modalName="Modify Installation"
                    onClose={(): void =>
                        dispatch({
                            payload: '',
                            type: 'SET_DIR_BEING_MODIFIED',
                        })
                    }
                    open={state.dirBeingModified !== ''}
                    text=""
                    width="100%"
                >
                    <ModifyInstallView
                        addedMods={state.modNamesAdded}
                        dirBeingModified={state.dirBeingModified}
                        onBackClicked={(): void =>
                            dispatch({
                                payload: '',
                                type: 'SET_DIR_BEING_MODIFIED',
                            })
                        }
                        onDequeueMod={async (
                            modName: string
                        ): Promise<void> => {
                            dispatch({ payload: modName, type: 'DEQUEUE_MOD' });
                        }}
                        onModSelected={handleFileSelected}
                        onOpenModsDir={openModsDir}
                        onQueueMod={async (modName: string): Promise<void> => {
                            dispatch({ payload: modName, type: 'QUEUE_MOD' });
                            viewFileDirsInZip(
                                `${await getModsDir()}\\${modName}`
                            ); // FIXME 100% temporary
                        }}
                        queuedMods={state.modNamesQueued}
                    />
                </Modal>

                <Modal
                    buttons={[
                        {
                            color: 'primary',
                            onClick: (): void => {
                                findInstallDirs();
                                handleInstallDirModalClose();
                            },
                            text: 'Yes',
                        },
                        {
                            color: 'neutral',
                            onClick: (): void => {
                                handleInstallDirModalClose();
                            },
                            text: 'No',
                        },
                    ]}
                    modalName="Installation Auto-Detection"
                    onClose={handleInstallDirModalClose}
                    open={state.installDirModalOpen}
                    text={AUTO_DETECT_INSTALL_TEXT}
                    width="50%"
                />
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Available Mods</h2>

                {state.modNamesAdded !== undefined &&
                    state.modNamesAdded.length === 0 && (
                        <div className="bg-base-200 p-4 rounded-lg">
                            <p>
                                You have not added any Call to Power II mods
                                yet. Add one below, then apply it to one of your
                                installations listed above by selecting it and
                                clicking on Apply Selected.
                            </p>
                        </div>
                    )}

                {state.loadingMods && (
                    <div className="flex justify-center my-4">
                        <span
                            aria-label="Loading mods"
                            className="loading loading-spinner loading-md"
                        ></span>
                    </div>
                )}

                {state.modNamesAdded !== undefined &&
                    !state.loadingMods &&
                    state.modNamesAdded.length > 0 && (
                        <div className="overflow-x-auto bg-base-200 rounded-lg">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th className="w-16">Select</th>
                                        <th>Mod Name</th>
                                        <th>Applied to Installations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {state.modNamesAdded.map((name) => (
                                        <tr className="hover" key={name}>
                                            <th>
                                                <label className="cursor-pointer">
                                                    <input
                                                        aria-label={`Select mod: ${name}`}
                                                        checked={state.checkedMods.includes(
                                                            name
                                                        )}
                                                        className="checkbox checkbox-primary"
                                                        onChange={(): void =>
                                                            dispatch({
                                                                payload: name,
                                                                type: 'TOGGLE_CHECKED_MOD',
                                                            })
                                                        }
                                                        type="checkbox"
                                                    />
                                                    <span className="sr-only">
                                                        Select {name}
                                                    </span>
                                                </label>
                                            </th>
                                            <td>{name}</td>
                                            <td>TODO</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="py-2" colSpan={3}>
                                            <div className="flex space-x-4">
                                                <button
                                                    aria-label="Delete selected mods"
                                                    className="btn btn-error btn-sm"
                                                    disabled={
                                                        state.checkedMods
                                                            .length === 0
                                                    }
                                                    onClick={async (): Promise<void> => {
                                                        for (const mod of state.checkedMods) {
                                                            await (
                                                                window as ElectronWindow
                                                            ).api.removeModFromMods(
                                                                'file:removeModFromMods',
                                                                mod
                                                            );
                                                        }
                                                        loadModFileNames();
                                                    }}
                                                >
                                                    <TrashIcon />
                                                    <span>Delete Selected</span>
                                                </button>
                                                <button
                                                    aria-label="Apply selected mods"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={
                                                        state.checkedMods
                                                            .length === 0 ||
                                                        state.installDirs
                                                            .length === 0 ||
                                                        state
                                                            .selectedInstallations
                                                            .length === 0
                                                    }
                                                    onClick={async (): Promise<void> => {
                                                        dispatch({
                                                            payload: true,
                                                            type: 'SET_APPLYING_MODS',
                                                        });
                                                        try {
                                                            for (const installIndex of state.selectedInstallations) {
                                                                await (
                                                                    window as ElectronWindow
                                                                ).api.applyModsToInstall(
                                                                    'file:applyModsToInstall',
                                                                    state
                                                                        .installDirs[
                                                                        installIndex
                                                                    ].directory,
                                                                    state.checkedMods
                                                                );
                                                            }
                                                        } finally {
                                                            dispatch({
                                                                payload: false,
                                                                type: 'SET_APPLYING_MODS',
                                                            });
                                                        }
                                                    }}
                                                >
                                                    <ApplyIcon />
                                                    <span>Apply Selected</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                <div className="mt-4">
                    <input
                        accept=".zip"
                        hidden
                        id="add-mod-button"
                        onChange={handleFileSelected}
                        type="file"
                    />
                    <button
                        aria-label="Add a new mod"
                        className="btn btn-primary"
                        onClick={(): void => {
                            document.getElementById('add-mod-button').click();
                        }}
                    >
                        Add Mod
                    </button>
                </div>
            </section>
        </div>
    );
};
