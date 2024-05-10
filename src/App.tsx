import React, { FC, useEffect, useState } from 'react';
import { Settings as SettingsMenu } from './components/Settings';
import { Modal } from './components/Modal';
import { AUTO_DETECT_INSTALL_TEXT } from './constants';
import { InstallDirTable } from './components/InstallDirTable';
import { ErrorModal } from './components/ErrorModal';
import { ModifyInstallView } from './components/ModifyInstallView';
import { SettingsIcon } from './components/icons/settings';

export type ElectronWindow = Window &
    typeof globalThis & {
        api: {
            getCtp2InstallDir: () => Promise<
                [
                    {
                        directory: string;
                        installationType: 'steam' | 'gog';
                        os: string;
                    },
                ]
            >;
            openInstallDir: (ipcCommand: string, dir: string) => void;
            openModsDir: (ipcCommand: string) => void;
            copyFileToModDir: (
                ipcCommand: string,
                fileDir: string
            ) => Promise<void>;
            viewFileDirsInZip: (
                ipcCommand: string,
                zipFilePath: string
            ) => Promise<string[]>;
            goToRoute: (ipcCommand: string, route: string) => void;
            loadMods: () => Promise<string[]>;
            getModsDir: (ipcCommand: string) => Promise<string>;
            selectFolder: (ipcCommand: string) => Promise<string>;
            isValidInstall: (
                ipcCommand: string,
                dir: string
            ) => Promise<boolean>;
            addToInstallDirs: (
                ipcCommand: string,
                dir: string
            ) => Promise<void>;
            getInstallDirs: (
                ipcCommand: 'file:getInstallDirs'
            ) => Promise<string[]>;
            runGame: (ipcCommand: 'file:runGame', exeDir: string) => void;
            removeFromInstallDirs: (
                ipcCommand: 'file:removeFromInstallDirs',
                dir: string
            ) => Promise<void>;
            makeBackup: (
                ipcCommand: 'file:makeBackup',
                installDir: string
            ) => Promise<void>;
            applyModsToInstall: (
                ipcCommand: 'file:applyModsToInstall',
                installDir: string,
                mods: string[]
            ) => Promise<void>;
        };
    };

export type InstallDirectory = {
    os: string;
    directory: string;
    installationType: 'steam' | 'gog';
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

    const loadMods = async (): Promise<void> => {
        try {
            const loadedMods = await (window as ElectronWindow).api.loadMods();
            setModNamesAdded(loadedMods);
        } catch (err) {
            console.error(
                `An error occurred within App while setting mod names: ${err}`
            );
            setError(
                `An error occurred while attempting to load mods: ${err}.`
            );
        }
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

        await loadMods();

        setLoadingDirs(false);
    };

    const handleInstallDirModalClose = (): void => {
        setInstallDirModalOpen(false);
    };

    const handleFileSelected = async (
        e: React.ChangeEvent<HTMLInputElement>
    ): Promise<void> => {
        const files = Array.from(e.target.files);
        await (window as ElectronWindow).api.copyFileToModDir(
            'file:copy',
            (files[0] as File & { path: string }).path
        );

        await loadMods();
    };

    const openModsDir = (): void => {
        console.log('opening mods dir');
        (window as ElectronWindow).api.openModsDir('file:openModsDir');
    };

    const viewFileDirsInZip = async (
        zipFilePath: string
    ): Promise<string[]> => {
        const contents = await (window as ElectronWindow).api.viewFileDirsInZip(
            'file:viewFileDirsInZip',
            zipFilePath
        );

        console.log('contents: ', contents);
        return contents;
    };

    const getModsDir = async (): Promise<string> => {
        return await (window as ElectronWindow).api.getModsDir(
            'file:getModsDir'
        );
    };

    useEffect(() => {
        loadMods();
        loadInstallDirs();
    }, []);

    return (
        <div className="p-6">
            <div className="flex justify-between">
                <p className="top-2 text-2xl">Call to Power 2 Installations</p>
                <div className="right-0 top-2 h-16 w-16">
                    <button onClick={() => setSettingsOpen(true)}>
                        <SettingsIcon />
                    </button>
                </div>
            </div>
            {error && (
                <ErrorModal
                    open={error.length > 0}
                    errorMessage={error}
                    onClose={() => {
                        setError('');
                    }}
                />
            )}
            {loadingDirs && (
                <span className="loading loading-ring loading-lg"></span>
            )}
            {settingsOpen && (
                <Modal
                    width="50%"
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    modalName="Settings"
                    text=""
                    buttons={[
                        {
                            text: 'Close',
                            onClick: () => setSettingsOpen(false),
                            color: 'neutral',
                        },
                    ]}
                >
                    <SettingsMenu />
                </Modal>
            )}

            <InstallDirTable
                installDirs={installDirs}
                onClickModify={(dir) => setDirBeingModified(dir)}
                onAddedInstallDirectory={() => loadInstallDirs()}
            />
            <Modal
                open={dirBeingModified !== ''}
                onClose={() => {
                    setDirBeingModified('');
                }}
                width="100%"
                height="100%"
                modalName="Modify Installations"
                buttons={[
                    {
                        text: 'Close',
                        onClick: () => setDirBeingModified(''),
                        color: 'neutral',
                    },
                ]}
                text=""
            >
                <ModifyInstallView
                    onBackClicked={() => setDirBeingModified('')}
                    dirBeingModified={dirBeingModified}
                    onModSelected={handleFileSelected}
                    onQueueMod={async (modName: string) => {
                        setModNamesQueued([...modNamesQueued, modName]);
                        setModNamesAdded(
                            modNamesAdded.filter((value) => value !== modName)
                        );
                        viewFileDirsInZip(`${await getModsDir()}\\${modName}`); // FIXME 100% temporary
                    }}
                    onDequeueMod={async (modName: string) => {
                        setModNamesQueued(
                            modNamesQueued.filter((value) => value !== modName)
                        );
                        setModNamesAdded([...modNamesAdded, modName]);
                    }}
                    addedMods={modNamesAdded}
                    queuedMods={modNamesQueued}
                    onOpenModsDir={() => openModsDir()}
                />
            </Modal>
            <Modal
                width="50%"
                open={installDirModalOpen}
                onClose={handleInstallDirModalClose}
                modalName="Installation Auto-Detection"
                text={AUTO_DETECT_INSTALL_TEXT}
                buttons={[
                    {
                        text: 'Yes',
                        onClick: () => {
                            findInstallDirs();
                            handleInstallDirModalClose();
                        },
                        color: 'primary',
                    },
                    {
                        text: 'No',
                        onClick: () => {
                            handleInstallDirModalClose();
                        },
                        color: 'neutral',
                    },
                ]}
            />
        </div>
    );
};
