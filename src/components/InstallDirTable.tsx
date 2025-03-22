/*
    Holds a table which displays the user-specified installation directories
*/

import React, { FC, useState } from 'react';

import { ElectronWindow, InstallDirectory } from '../App';
import { FolderIcon } from './icons/folder';
import { PlayIcon } from './icons/play';
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
}) => {
    const [deletePopupOpen, setDeletePopupOpen] = useState<string>('');

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
        (window as ElectronWindow).api.runGame(
            'file:runGame',
            `${dir}\\ctp2_program\\ctp\\ctp2.exe`
        );
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
                <div className="overflow-x-auto bg-base-200 rounded-lg">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Installation</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {installDirs.map((installDir) => (
                                <tr
                                    className="hover"
                                    key={installDir.directory}
                                >
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
                                            <button
                                                aria-label="Open Directory"
                                                className="btn btn-sm btn-accent"
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
                                                <span>Remove Installation</span>
                                            </button>
                                            <button
                                                aria-label="Run game"
                                                className="btn btn-sm btn-success"
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
                                            <button
                                                aria-label="Modify installation"
                                                className="btn btn-sm btn-primary"
                                                onClick={(): void =>
                                                    onClickModify(
                                                        installDir.directory
                                                    )
                                                }
                                            >
                                                <WrenchIcon />
                                                <span>Modify</span>
                                            </button>
                                            <div className="dropdown dropdown-end">
                                                <button
                                                    aria-label="Backup options"
                                                    className="btn btn-sm btn-secondary"
                                                    tabIndex={0}
                                                >
                                                    Backup Options
                                                </button>
                                                <ul
                                                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                                                    tabIndex={0}
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
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                    className="btn btn-secondary"
                    onClick={openModsDir}
                >
                    Open Mods Directory
                </button>
            </div>
        </div>
    );
};
