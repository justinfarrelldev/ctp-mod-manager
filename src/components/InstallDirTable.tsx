/*
    Holds a table which displays the user-specified installation directories
*/

import React, { FC, useState } from 'react';
import { ElectronWindow, InstallDirectory } from '../App';
import { Modal } from './Modal';
import { FolderIcon } from './icons/folder';
import { WrenchIcon } from './icons/wrench';
import { TrashIcon } from './icons/trash';
import { PlayIcon } from './icons/play';
import { InstallationPathText } from './InstallationPathText';

interface Props {
    installDirs: InstallDirectory[];
    onClickModify: (dirPathBeingModified: string) => void;
    onAddedInstallDirectory: () => void;
}

const openInstallDir = (dir: string): void => {
    console.log('opening install dir: ', dir);
    (window as ElectronWindow).api.openInstallDir('file:openInstallDir', dir);
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
    installDirs,
    onClickModify,
    onAddedInstallDirectory,
}) => {
    const [deletePopupOpen, setDeletePopupOpen] = useState<string>('');

    const addInstall = async () => {
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

    const removeInstall = async (dir: string) => {
        removeFromInstallDirs(dir);
        onAddedInstallDirectory();
    };

    const runGame = (dir: string) => {
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
                            width="50%"
                            open={deletePopupOpen !== ''}
                            onClose={() => setDeletePopupOpen('')}
                            modalName="Remove Installation From Mod Manager"
                            text={
                                'This will remove the installation from the "installations" list in the mod manager, but it will not delete any actual files. Are you sure you want to do this?'
                            }
                            buttons={[
                                {
                                    text: 'Yes',
                                    onClick: () => {
                                        removeInstall(deletePopupOpen);
                                        setDeletePopupOpen('');
                                    },
                                    color: 'primary',
                                },
                                {
                                    text: 'No',
                                    onClick: () => {
                                        setDeletePopupOpen('');
                                    },
                                    color: 'neutral',
                                },
                            ]}
                        />
                    )}
                    <div className="flex justify-between p-6">
                        <div className="space-x-10">
                            <span>
                                <button
                                    onClick={() =>
                                        openInstallDir(dir.directory)
                                    }
                                >
                                    <FolderIcon />
                                </button>
                            </span>
                            <span>
                                <button
                                    onClick={() => {
                                        onClickModify(dir.directory);
                                    }}
                                >
                                    <WrenchIcon />
                                </button>
                            </span>
                            <span>
                                <button
                                    onClick={() => {
                                        setDeletePopupOpen(dir.directory);
                                    }}
                                >
                                    <TrashIcon />
                                </button>
                            </span>
                            <span>
                                <button
                                    onClick={() => {
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
                                    | 'steam'
                                    | 'gog'
                            }
                        />
                    </div>
                </div>
            ))}
            <button className="btn btn-primary" onClick={() => addInstall()}>
                Add Installation
            </button>
        </>
    );
};
