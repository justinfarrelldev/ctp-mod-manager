/*
    Holds a table which displays the user-specified installation directories
*/

import React, { FC, useEffect, useState } from 'react';

import { ElectronWindow, InstallDirectory } from '../App';
import { BackupIcon } from './icons/backup';
import { FolderIcon } from './icons/folder';
import { PlayIcon } from './icons/play';
import { StopIcon } from './icons/stop';
import { TrashIcon } from './icons/trash';
import { WrenchIcon } from './icons/wrench';
import { InstallationPathText } from './InstallationPathText';
import { Modal } from './Modal';

interface Props {
    creatingBackup: string; // Add new prop
    installDirs: InstallDirectory[];
    onAddedInstallDirectory: () => void;
    onClickCreateBackup: (dir: string) => Promise<void>; // Add new prop
    onClickDeleteBackup: (dir: string) => void;
    onClickModify: (dirPathBeingModified: string) => void;
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
    onClickModify,
    onClickRestoreBackup,
    onSelectInstallation,
}) => {
    const [deletePopupOpen, setDeletePopupOpen] = useState<string>('');
    const [runningGames, setRunningGames] = useState<Record<string, boolean>>(
        {}
    );

    // Check game status periodically
    useEffect(() => {
        const checkGameStatus = async () => {
            const newRunningGames: Record<string, boolean> = {};

            for (const installDir of installDirs) {
                const exePath = `${installDir.directory}\\ctp2_program\\ctp\\ctp2.exe`;
                const isRunning = await (
                    window as ElectronWindow
                ).api.isGameRunning('file:isGameRunning', exePath);
                newRunningGames[exePath] = isRunning;
            }

            setRunningGames(newRunningGames);
        };

        // Initial check
        checkGameStatus();

        // Set up interval to check every 5 seconds
        const interval = setInterval(checkGameStatus, 5000);

        // Clean up
        return () => clearInterval(interval);
    }, [installDirs]);

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
        const exePath = `${dir}\\ctp2_program\\ctp\\ctp2.exe`;
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
                                const exePath = `${installDir.directory}\\ctp2_program\\ctp\\ctp2.exe`;
                                const isGameRunning = runningGames[exePath];

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
                                                <div className="dropdown dropdown-end">
                                                    <button
                                                        aria-label="Backup options"
                                                        className="btn btn-sm btn-primary"
                                                        tabIndex={0}
                                                    >
                                                        <BackupIcon />
                                                        <span>
                                                            Backup Options
                                                        </span>
                                                    </button>
                                                    <ul
                                                        className="dropdown-content z-9999 menu p-2 shadow-sm bg-base-100 rounded-box w-52"
                                                        style={{
                                                            maxHeight: '300px',
                                                            overflowY: 'auto',
                                                            position:
                                                                'relative', // FIXME a very temporary fix until I can figure this out in Tailwind
                                                        }}
                                                    >
                                                        <li>
                                                            <button
                                                                aria-label="Restore backup"
                                                                onClick={(): void =>
                                                                    onClickRestoreBackup(
                                                                        installDir.directory
                                                                    )
                                                                }
                                                            >
                                                                Restore Backup
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                aria-label="Create backup"
                                                                disabled={
                                                                    creatingBackup ===
                                                                    installDir.directory
                                                                }
                                                                onClick={async (): Promise<void> =>
                                                                    onClickCreateBackup(
                                                                        installDir.directory
                                                                    )
                                                                }
                                                            >
                                                                {creatingBackup ===
                                                                installDir.directory ? (
                                                                    <>
                                                                        <span className="loading loading-spinner loading-xs"></span>
                                                                        Creating...
                                                                    </>
                                                                ) : (
                                                                    'Create Backup'
                                                                )}
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                aria-label="Delete backup"
                                                                className="text-error"
                                                                onClick={(): void =>
                                                                    onClickDeleteBackup(
                                                                        installDir.directory
                                                                    )
                                                                }
                                                            >
                                                                Delete Backup
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>

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
