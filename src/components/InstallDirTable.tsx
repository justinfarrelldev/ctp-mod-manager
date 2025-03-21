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
        <>
            {installDirs.length === 0 && (
                <p className="text-lg">
                    No installation directories have been added yet. Add one
                    now?
                </p>
            )}

            {installDirs.map((dir) => (
                <div key={dir.directory}>
                    {deletePopupOpen && (
                        <Modal
                            buttons={[
                                {
                                    color: 'primary',
                                    onClick: (): void => {
                                        removeInstall(deletePopupOpen);
                                        setDeletePopupOpen('');
                                    },
                                    text: 'Yes',
                                },
                                {
                                    color: 'neutral',
                                    onClick: (): void => {
                                        setDeletePopupOpen('');
                                    },
                                    text: 'No',
                                },
                            ]}
                            modalName="Remove Installation From Mod Manager"
                            onClose={(): void => setDeletePopupOpen('')}
                            open={deletePopupOpen !== ''}
                            text={
                                'This will remove the installation from the "installations" list in the mod manager, but it will not delete any actual files. Are you sure you want to do this?'
                            }
                            width="50%"
                        />
                    )}
                    <div className="flex justify-between p-6">
                        <div className="space-x-10">
                            <span>
                                <button
                                    onClick={(): void =>
                                        openDirectory(dir.directory)
                                    }
                                >
                                    <FolderIcon />
                                </button>
                            </span>
                            <span>
                                <button
                                    onClick={(): void => {
                                        setDeletePopupOpen(dir.directory);
                                    }}
                                >
                                    <TrashIcon />
                                </button>
                            </span>
                            <span>
                                <button
                                    onClick={(): void => {
                                        //onClickModify(dir.directory);
                                        runGame(dir.directory);
                                    }}
                                >
                                    <PlayIcon />
                                </button>
                            </span>
                        </div>
                        <InstallationPathText
                            dir={dir.directory}
                            installationType={
                                dir.installationType.toUpperCase() as
                                    | 'gog'
                                    | 'steam'
                            }
                        />
                    </div>
                </div>
            ))}
            <div className="flex space-x-4 mb-4">
                <button className="btn btn-primary" onClick={addInstall}>
                    Add Installation
                </button>
                <button className="btn btn-secondary" onClick={openModsDir}>
                    Open Mods Directory
                </button>
            </div>
            <table className="table w-full">
                {/* ...table header */}
                <tbody>
                    {installDirs.map((installDir) => (
                        <tr key={installDir.directory}>
                            {/* ...existing columns */}
                            <td>
                                <div className="flex space-x-2">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={(): void =>
                                            onClickModify(installDir.directory)
                                        }
                                    >
                                        Modify
                                    </button>
                                    {/* Add this button */}
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={(): void =>
                                            onClickRestoreBackup(
                                                installDir.directory
                                            )
                                        }
                                    >
                                        Restore Backup
                                    </button>
                                    <button
                                        className="btn btn-secondary btn-sm"
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
                                    <button
                                        className="btn btn-error btn-sm"
                                        onClick={(): void =>
                                            onClickDeleteBackup(
                                                installDir.directory
                                            )
                                        }
                                    >
                                        {' '}
                                        Delete Backup
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};
