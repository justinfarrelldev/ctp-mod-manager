import React, { FC, useEffect, useState } from 'react';
import { themeChange } from 'theme-change';
import { ReadonlyDeep } from 'type-fest';

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
    const [creatingBackup, setCreatingBackup] = useState<string>(''); // Add state for tracking backup creation
    const [deleteBackupOpen, setDeleteBackupOpen] = useState<boolean>(false);
    const [deletingBackupDir, setDeletingBackupDir] = useState<string>('');
    const [selectedInstallations, setSelectedInstallations] = useState<
        number[]
    >([]);

    const handleRestoreBackupClick = (installDir: string): void => {
        setBackupInstallDir(installDir);
        setBackupRestoreOpen(true);
    };

    const handleCreateBackupClick = async (
        installDir: string
    ): Promise<void> => {
        setCreatingBackup(installDir);
        try {
            await (window as ElectronWindow).api.makeBackup(
                'file:makeBackup',
                installDir
            );
        } catch (err) {
            console.error(`Failed to create backup: ${err}`);
            setError(`Failed to create backup: ${err}`);
        } finally {
            setCreatingBackup('');
        }
    };

    const handleDeleteBackupClick = (installDir: string): void => {
        setDeletingBackupDir(installDir);
        setDeleteBackupOpen(true);
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
        e: ReadonlyDeep<React.ChangeEvent<HTMLInputElement>>
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
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Add the DeleteBackupModal */}
            <DeleteBackupModal
                installDir={deletingBackupDir}
                onClose={(): void => setDeleteBackupOpen(false)}
                open={deleteBackupOpen}
            />
            {/* Existing BackupRestoreModal */}
            <BackupRestoreModal
                installDir={backupInstallDir}
                onClose={(): void => setBackupRestoreOpen(false)}
                open={backupRestoreOpen}
            />

            <header className="flex justify-between items-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold">
                    Call to Power II Mod Manager
                </h1>
                <button
                    aria-label="Open Settings"
                    className="btn btn-ghost btn-circle"
                    onClick={(): void => setSettingsOpen(true)}
                >
                    <SettingsIcon />
                </button>
            </header>

            {error && (
                <ErrorModal
                    errorMessage={error}
                    onClose={(): void => {
                        setError('');
                    }}
                    open={error.length > 0}
                />
            )}

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    Installation Directories
                </h2>

                {loadingDirs && (
                    <div className="flex justify-center my-4">
                        <span
                            aria-label="Loading installation directories"
                            className="loading loading-spinner loading-lg"
                        ></span>
                    </div>
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
                        onClose={(): void => setSettingsOpen(false)}
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
                        onClose={(): void => setApplyingMods(false)}
                        open={applyingMods}
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
                    creatingBackup={creatingBackup}
                    installDirs={installDirs}
                    onAddedInstallDirectory={loadInstallDirs}
                    onClickCreateBackup={handleCreateBackupClick}
                    onClickDeleteBackup={handleDeleteBackupClick}
                    onClickModify={setDirBeingModified}
                    onClickRestoreBackup={handleRestoreBackupClick}
                    onSelectInstallation={(index): void => {
                        if (selectedInstallations.includes(index)) {
                            const installations = selectedInstallations.filter(
                                (value) => value !== index
                            );

                            setSelectedInstallations(installations);
                        } else {
                            setSelectedInstallations([
                                ...selectedInstallations,
                                index,
                            ]);
                        }
                    }}
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
                    onClose={(): void => setDirBeingModified('')}
                    open={dirBeingModified !== ''}
                    text=""
                    width="100%"
                >
                    <ModifyInstallView
                        addedMods={modNamesAdded}
                        dirBeingModified={dirBeingModified}
                        onBackClicked={(): void => setDirBeingModified('')}
                        onDequeueMod={async (
                            modName: string
                        ): Promise<void> => {
                            setModNamesQueued(
                                modNamesQueued.filter(
                                    (value) => value !== modName
                                )
                            );
                            setModNamesAdded([...modNamesAdded, modName]);
                        }}
                        onModSelected={handleFileSelected}
                        onOpenModsDir={openModsDir}
                        onQueueMod={async (modName: string): Promise<void> => {
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
                    open={installDirModalOpen}
                    text={AUTO_DETECT_INSTALL_TEXT}
                    width="50%"
                />
            </section>

            <section className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Available Mods</h2>

                {modNamesAdded !== undefined && modNamesAdded.length === 0 && (
                    <div className="bg-base-200 p-4 rounded-lg">
                        <p>
                            You have not added any Call to Power II mods yet.
                            Add one below, then apply it to one of your
                            installations listed above by selecting it and
                            clicking on Apply Selected.
                        </p>
                    </div>
                )}

                {loadingMods && (
                    <div className="flex justify-center my-4">
                        <span
                            aria-label="Loading mods"
                            className="loading loading-spinner loading-md"
                        ></span>
                    </div>
                )}

                {modNamesAdded !== undefined &&
                    !loadingMods &&
                    modNamesAdded.length > 0 && (
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
                                    {modNamesAdded.map((name) => (
                                        <tr className="hover" key={name}>
                                            <th>
                                                <label className="cursor-pointer">
                                                    <input
                                                        aria-label={`Select mod: ${name}`}
                                                        className="checkbox checkbox-primary"
                                                        onChange={(
                                                            event
                                                        ): void => {
                                                            if (
                                                                event.target
                                                                    .checked
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
                                                        checkedMods.length === 0
                                                    }
                                                    onClick={(): void => {
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
                                                    <span>Delete Selected</span>
                                                </button>
                                                <button
                                                    aria-label="Apply selected mods"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={
                                                        checkedMods.length ===
                                                            0 ||
                                                        installDirs.length ===
                                                            0 ||
                                                        selectedInstallations.length ===
                                                            0
                                                    }
                                                    onClick={async (): Promise<void> => {
                                                        setApplyingMods(true);
                                                        for (const installationIndex in selectedInstallations) {
                                                            await (
                                                                window as ElectronWindow
                                                            ).api.applyModsToInstall(
                                                                'file:applyModsToInstall',
                                                                installDirs[
                                                                    installationIndex
                                                                ].directory,
                                                                checkedMods
                                                            );
                                                        }
                                                        setApplyingMods(false);
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
