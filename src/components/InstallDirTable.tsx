/*
    Holds a table which displays the user-specified installation directories
*/

import React, { FC, useEffect, useState } from 'react';

import { ElectronWindow, InstallDirectory } from '../App';
import { BackupOptionsModal } from './BackupOptionsModal';
import { BackupIcon } from './icons/backup';
import { FolderIcon } from './icons/folder';
import { PlayIcon } from './icons/play';
import { StopIcon } from './icons/stop';
import { TrashIcon } from './icons/trash';
import { Modal } from './Modal';

interface Props {
    creatingBackup: string; // Add new prop
    installDirs: InstallDirectory[];
    onAddedInstallDirectory: () => void;
    onClickCreateBackup: (dir: string) => Promise<void>; // Add new prop
    onClickDeleteBackup: (dir: string) => void;
    onClickRestoreBackup: (dir: string) => void;
    onSelectInstallation: (index: number) => void;
}

const openDirectory = (dir: string): void => {
    console.log('opening install dir: ', dir);
    (window as ElectronWindow).api.openDirectory('file:openInstallDir', dir);
};

const openModsDir = (): void => {
    (window as ElectronWindow).api.openModsDir('file:openModsDir');
};

const addToInstallDirs = async (dir: string): Promise<void> => {
    await (window as ElectronWindow).api.addToInstallDirs(
        'file:addToInstallDirs',
        dir
    );
};

const removeFromInstallDirs = async (dir: string): Promise<void> => {
    await (window as ElectronWindow).api.removeFromInstallDirs(
        'file:removeFromInstallDirs',
        dir
    );
};

export const InstallDirTable: FC<Props> = ({
    creatingBackup,
    installDirs,
    onAddedInstallDirectory,
    onClickCreateBackup,
    onClickDeleteBackup,
    onClickRestoreBackup,
    onSelectInstallation,
}) => {
    const [deletePopupOpen, setDeletePopupOpen] = useState<string>('');
    const [runningGames, setRunningGames] = useState<Record<string, boolean>>(
        {}
    );
    const [executablePaths, setExecutablePaths] = useState<
        Record<string, string>
    >({});
    const [backupOptionsDir, setBackupOptionsDir] = useState<string>('');

    // Get executable paths for each install directory
    useEffect(() => {
        const loadExecutablePaths = async (): Promise<void> => {
            const paths: Record<string, string> = {};

            for (const installDir of installDirs) {
                const exePath = await (
                    window as ElectronWindow
                ).api.getCtp2ExecutablePath(
                    'file:getCtp2ExecutablePath',
                    installDir.directory
                );
                paths[installDir.directory] = exePath;
            }

            setExecutablePaths(paths);
        };

        loadExecutablePaths();
    }, [installDirs]);

    // Check game status periodically
    useEffect(() => {
        const checkGameStatus = async (): Promise<void> => {
            const newRunningGames: Record<string, boolean> = {};

            for (const installDir of installDirs) {
                if (!executablePaths[installDir.directory]) continue;

                const exePath = executablePaths[installDir.directory];
                const isRunning = await (
                    window as ElectronWindow
                ).api.isGameRunning('file:isGameRunning', exePath);
                newRunningGames[exePath] = isRunning;
            }

            setRunningGames(newRunningGames);
        };

        // Only run the check if we have executable paths
        if (Object.keys(executablePaths).length > 0) {
            // Initial check
            checkGameStatus();

            // Set up interval to check every 5 seconds
            const interval = setInterval(checkGameStatus, 5000);

            // Clean up
            return () => clearInterval(interval);
        }
    }, [installDirs, executablePaths]);

    const addInstall = async (): Promise<void> => {
        const folder = await (window as ElectronWindow).api.selectFolder(
            'file:selectFolder'
        );
        const isValidInstall = await (
            window as ElectronWindow
        ).api.isValidInstall('file:isValidInstall', folder);

        if (isValidInstall) {
            console.log('This is a valid install');
            addToInstallDirs(folder);
            onAddedInstallDirectory();
        } else {
            console.error('Invalid install! Inform the user here!');
        }
    };

    const removeInstall = async (dir: string): Promise<void> => {
        removeFromInstallDirs(dir);
        onAddedInstallDirectory();
    };

    const runGame = (dir: string): void => {
        if (!executablePaths[dir]) return;

        const exePath = executablePaths[dir];
        (window as ElectronWindow).api.runGame('file:runGame', exePath);

        // Update running state immediately for better UX
        setRunningGames((prev) => ({
            ...prev,
            [exePath]: true,
        }));
    };

    const stopGame = async (): Promise<void> => {
        const stopped = await (window as ElectronWindow).api.stopGame(
            'file:stopGame'
        );

        if (stopped) {
            // Update all game states after stopping
            const newRunningGames: Record<string, boolean> = {};
            for (const key in runningGames) {
                newRunningGames[key] = false;
            }
            setRunningGames(newRunningGames);
        }
    };

    return (
        <div className="space-y-4">
            {deletePopupOpen && (
                <Modal
                    buttons={[
                        {
                            color: 'error',
                            onClick: (): void => {
                                removeInstall(deletePopupOpen);
                                setDeletePopupOpen('');
                            },
                            text: 'Yes, Remove',
                        },
                        {
                            color: 'neutral',
                            onClick: (): void => {
                                setDeletePopupOpen('');
                            },
                            text: 'Cancel',
                        },
                    ]}
                    modalName="Remove Installation Directory"
                    onClose={(): void => setDeletePopupOpen('')}
                    open={deletePopupOpen !== ''}
                    text={
                        'This will remove the installation from the list but will not delete any actual files. Continue?'
                    }
                    width="50%"
                />
            )}

            <BackupOptionsModal
                creatingBackup={creatingBackup}
                installDir={backupOptionsDir}
                onClickCreateBackup={async (dir: string): Promise<void> => {
                    await onClickCreateBackup(dir);
                    setBackupOptionsDir('');
                }}
                onClickDeleteBackup={(dir: string): void => {
                    onClickDeleteBackup(dir);
                    setBackupOptionsDir('');
                }}
                onClickRestoreBackup={(dir: string): void => {
                    onClickRestoreBackup(dir);
                    setBackupOptionsDir('');
                }}
                onClose={(): void => setBackupOptionsDir('')}
                open={backupOptionsDir !== ''}
            />

            {installDirs.length === 0 ? (
                <div className="bg-base-200 p-4 rounded-lg text-center">
                    <p className="text-lg mb-4">
                        No installation directories have been added yet.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto overflow-auto bg-base-200 rounded-lg">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Installation</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {installDirs.map((installDir, idx) => {
                                const exePath =
                                    executablePaths[installDir.directory];
                                const isGameRunning = exePath
                                    ? runningGames[exePath]
                                    : false;

                                return (
                                    <tr
                                        className="hover"
                                        key={installDir.directory}
                                    >
                                        <th>
                                            <label className="cursor-pointer">
                                                <input
                                                    aria-label={`Select installation: ${installDir.directory}`}
                                                    className="checkbox checkbox-primary"
                                                    onChange={(): void => {
                                                        onSelectInstallation(
                                                            idx
                                                        );
                                                    }}
                                                    type="checkbox"
                                                />
                                                <span className="sr-only">
                                                    Select{' '}
                                                    {installDir.directory}
                                                </span>
                                            </label>
                                        </th>
                                        <td className="font-medium break-all">
                                            {installDir.directory}
                                        </td>
                                        <td>
                                            <span className="badge badge-neutral text-xs">
                                                {installDir.installationType.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-2">
                                                {isGameRunning ? (
                                                    <button
                                                        aria-label="Stop game"
                                                        className="btn btn-sm btn-error"
                                                        data-tip="Stop Game"
                                                        onClick={stopGame}
                                                    >
                                                        <StopIcon />
                                                        <span>Stop Game</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        aria-label="Run game"
                                                        className="btn btn-sm btn-primary"
                                                        data-tip="Run Game"
                                                        onClick={(): void =>
                                                            runGame(
                                                                installDir.directory
                                                            )
                                                        }
                                                    >
                                                        <PlayIcon />
                                                        <span>Run Game</span>
                                                    </button>
                                                )}

                                                <button
                                                    aria-label="Open Directory"
                                                    className="btn btn-sm btn-primary"
                                                    data-tip="Open Directory"
                                                    onClick={(): void =>
                                                        openDirectory(
                                                            installDir.directory
                                                        )
                                                    }
                                                >
                                                    <FolderIcon />
                                                    <span>
                                                        Open Installation Folder
                                                    </span>
                                                </button>
                                                <button
                                                    aria-label="Backup options"
                                                    className="btn btn-sm btn-primary"
                                                    onClick={(): void =>
                                                        setBackupOptionsDir(
                                                            installDir.directory
                                                        )
                                                    }
                                                >
                                                    <BackupIcon />
                                                    <span>Backup Options</span>
                                                </button>

                                                <button
                                                    aria-label="Remove installation"
                                                    className="btn btn-sm btn-error"
                                                    data-tip="Remove"
                                                    onClick={(): void =>
                                                        setDeletePopupOpen(
                                                            installDir.directory
                                                        )
                                                    }
                                                >
                                                    <TrashIcon />
                                                    <span>
                                                        Remove Installation
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4">
                <button
                    aria-label="Add new installation directory"
                    className="btn btn-primary"
                    onClick={addInstall}
                >
                    Add Installation
                </button>
                <button
                    aria-label="Open mods directory"
                    className="btn btn-primary"
                    onClick={openModsDir}
                >
                    Open Mods Directory
                </button>
            </div>
        </div>
    );
};
