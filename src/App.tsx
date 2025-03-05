import React, { FC, useEffect, useState } from 'react';
import { themeChange } from 'theme-change';

import { BackupRestoreModal } from './components/BackupRestoreModal';
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
                mods: string[]
            ) => Promise<void>;
            copyFileToModDir: (
                ipcCommand: string,
                fileDir: string
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
            isValidInstall: (
                ipcCommand: string,
                dir: string
            ) => Promise<boolean>;
            listBackups: () => Promise<string[]>;
            loadModFileNames: () => Promise<string[]>;
            makeBackup: (
                ipcCommand: 'file:makeBackup',
                installDir: string
            ) => Promise<void>;
            openInstallDir: (ipcCommand: string, dir: string) => void;
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
    const [loadingDirs, setLoadingDirs] = useState<boolean>();
    const [installDirModalOpen, setInstallDirModalOpen] =
        useState<boolean>(false);
    const [installDirs, setInstallDirs] = useState<InstallDirectory[]>([]);
    const [dirBeingModified, setDirBeingModified] = useState<string>('');
    const [settingsOpen, setSettingsOpen] = useState<boolean>();
    const [modNamesAdded, setModNamesAdded] = useState<string[] | undefined>(
        undefined
    );
    const [modNamesQueued, setModNamesQueued] = useState<string[]>([]);
    const [error, setError] = useState<string>();
    const [checkedMods, setCheckedMods] = useState<string[]>([]);
    const [loadingMods, setLoadingMods] = useState<boolean>(false);
    const [applyingMods, setApplyingMods] = useState<boolean>(false);

    const [backupRestoreOpen, setBackupRestoreOpen] = useState<boolean>(false);
    const [backupInstallDir, setBackupInstallDir] = useState<string>('');

    const handleRestoreBackupClick = (installDir: string): void => {
        setBackupInstallDir(installDir);
        setBackupRestoreOpen(true);
    };

    const loadModFileNames = async (): Promise<void> => {
        setLoadingMods(true);
        try {
            const loadedMods = await (
                window as ElectronWindow
            ).api.loadModFileNames();
            setModNamesAdded(loadedMods);
        } catch (err) {
            console.error(
                `An error occurred within App while setting mod names: ${err}`
            );
            setError(
                `An error occurred while attempting to load mods: ${err}.`
            );
            setLoadingMods(false);
        }
        setLoadingMods(false);
    };

    const loadInstallDirs = async (): Promise<void> => {
        setLoadingDirs(true);
        const dirsFromFile = await (
            window as ElectronWindow
        ).api.getInstallDirs('file:getInstallDirs');

        setInstallDirs(
            dirsFromFile.map((dir) => ({
                directory: dir,
                installationType: 'steam',
                os: 'win32',
            }))
        );
        setLoadingDirs(false);
        if (dirsFromFile.length === 0) {
            setInstallDirModalOpen(true);
        }
    };

    const findInstallDirs = async (): Promise<void> => {
        setLoadingDirs(true);
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

        setInstallDirs([...installDirs, ...dirs]);

        await loadModFileNames();

        setLoadingDirs(false);
    };

    const handleInstallDirModalClose = (): void => {
        setInstallDirModalOpen(false);
    };

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        setLoadingMods(true);
        const files = Array.from(e.target.files);
        await (window as ElectronWindow).api.copyFileToModDir(
            'file:copy',
            (files[0] as File & { path: string }).path
        );

        setLoadingMods(false);
        await loadModFileNames();
    };

    const openModsDir = (): void => {
        (window as ElectronWindow).api.openModsDir('file:openModsDir');
    };

    const viewFileDirsInZip = async (
        zipFilePath: string
    ): Promise<string[]> => {
        const contents = await (window as ElectronWindow).api.viewFileDirsInZip(
            'file:viewFileDirsInZip',
            zipFilePath
        );

        return contents;
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
        <div>
            <div className="p-6">
                {/* Add the BackupRestoreModal */}
                <BackupRestoreModal
                    installDir={backupInstallDir}
                    onClose={() => setBackupRestoreOpen(false)}
                    open={backupRestoreOpen}
                />
                <div className="flex justify-between">
                    <p className="top-2 text-2xl font-bold">
                        Call to Power II Installations
                    </p>
                    <div className="right-0 top-2 h-16 w-16">
                        <button onClick={() => setSettingsOpen(true)}>
                            <SettingsIcon />
                        </button>
                    </div>
                </div>
                {error && (
                    <ErrorModal
                        errorMessage={error}
                        onClose={() => {
                            setError('');
                        }}
                        open={error.length > 0}
                    />
                )}
                {loadingDirs && (
                    <span className="loading loading-ring loading-lg"></span>
                )}
                {settingsOpen && (
                    <Modal
                        buttons={[
                            {
                                color: 'neutral',
                                onClick: () => setSettingsOpen(false),
                                text: 'Close',
                            },
                        ]}
                        modalName="Settings"
                        onClose={() => setSettingsOpen(false)}
                        open={settingsOpen}
                        text=""
                        width="50%"
                    >
                        <SettingsMenu />
                    </Modal>
                )}
                {applyingMods && (
                    <Modal
                        buttons={[
                            {
                                color: 'neutral',
                                onClick: () => setApplyingMods(false),
                                text: 'Cancel',
                            },
                        ]}
                        modalName="Applying Mods"
                        onClose={() => setApplyingMods(false)}
                        open={applyingMods}
                        text=""
                        width="50%"
                    >
                        <p>
                            Applying mods, please wait (this can take a
                            while)...
                        </p>
                        <span className="loading loading-bars loading-md block"></span>
                    </Modal>
                )}

                <InstallDirTable
                    installDirs={installDirs}
                    onAddedInstallDirectory={() => loadInstallDirs()}
                    onClickModify={(dir) => setDirBeingModified(dir)}
                    onClickRestoreBackup={handleRestoreBackupClick} // Add this prop
                />
                <Modal
                    buttons={[
                        {
                            color: 'neutral',
                            onClick: () => setDirBeingModified(''),
                            text: 'Close',
                        },
                    ]}
                    height="100%"
                    modalName="Modify Installation"
                    onClose={() => {
                        setDirBeingModified('');
                    }}
                    open={dirBeingModified !== ''}
                    text=""
                    width="100%"
                >
                    <ModifyInstallView
                        addedMods={modNamesAdded}
                        dirBeingModified={dirBeingModified}
                        onBackClicked={() => setDirBeingModified('')}
                        onDequeueMod={async (modName: string) => {
                            setModNamesQueued(
                                modNamesQueued.filter(
                                    (value) => value !== modName
                                )
                            );
                            setModNamesAdded([...modNamesAdded, modName]);
                        }}
                        onModSelected={handleFileSelected}
                        onOpenModsDir={() => openModsDir()}
                        onQueueMod={async (modName: string) => {
                            setModNamesQueued([...modNamesQueued, modName]);
                            setModNamesAdded(
                                modNamesAdded.filter(
                                    (value) => value !== modName
                                )
                            );
                            viewFileDirsInZip(
                                `${await getModsDir()}\\${modName}`
                            ); // FIXME 100% temporary
                        }}
                        queuedMods={modNamesQueued}
                    />
                </Modal>
                <Modal
                    buttons={[
                        {
                            color: 'primary',
                            onClick: () => {
                                findInstallDirs();
                                handleInstallDirModalClose();
                            },
                            text: 'Yes',
                        },
                        {
                            color: 'neutral',
                            onClick: () => {
                                handleInstallDirModalClose();
                            },
                            text: 'No',
                        },
                    ]}
                    modalName="Installation Auto-Detection"
                    onClose={handleInstallDirModalClose}
                    open={installDirModalOpen}
                    text={AUTO_DETECT_INSTALL_TEXT}
                    width="50%"
                />
            </div>
            <div className="p-6">
                <p className="top-2 text-2xl font-bold">
                    Call to Power II Mods
                </p>
                {modNamesAdded !== undefined && modNamesAdded.length === 0 && (
                    <p>
                        You have not added any Call to Power II mods just yet.
                        Add one below, then apply it to one of your
                        installations listed above using the "Modify" menu.
                    </p>
                )}
                {modNamesAdded !== undefined &&
                    !loadingMods &&
                    modNamesAdded.length > 0 && (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>Mod Name</th>
                                    <th>Applied to Installations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modNamesAdded.map((name) => (
                                    <tr key={name}>
                                        <th>
                                            <label>
                                                <input
                                                    className="checkbox"
                                                    onChange={(event) => {
                                                        if (
                                                            event.target.checked
                                                        ) {
                                                            setCheckedMods([
                                                                ...checkedMods,
                                                                name,
                                                            ]);
                                                        } else {
                                                            setCheckedMods([
                                                                ...checkedMods.filter(
                                                                    (mod) =>
                                                                        mod !==
                                                                        name
                                                                ),
                                                            ]);
                                                        }
                                                    }}
                                                    type="checkbox"
                                                />
                                            </label>
                                        </th>
                                        <td>
                                            <p>{name}</p>
                                        </td>
                                        <td>
                                            <p>TODO</p>
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td className="space-x-10">
                                        <button
                                            onClick={() => {
                                                for (const mod of checkedMods) {
                                                    (
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
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setApplyingMods(true);

                                                await (
                                                    window as ElectronWindow
                                                ).api.applyModsToInstall(
                                                    'file:applyModsToInstall',
                                                    installDirs[0].directory,
                                                    checkedMods
                                                );
                                                setApplyingMods(false);
                                            }}
                                        >
                                            <ApplyIcon />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    )}
                {loadingMods && (
                    <span className="loading loading-bars loading-md block"></span>
                )}
                <input
                    accept=".zip"
                    hidden
                    id="add-mod-button"
                    onChange={handleFileSelected}
                    type="file"
                />
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        document.getElementById('add-mod-button').click();
                    }}
                >
                    Add Mod
                </button>
            </div>
        </div>
    );
};
