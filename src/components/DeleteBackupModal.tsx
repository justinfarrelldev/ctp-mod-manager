import React, { FC, useEffect, useState } from 'react';

import { ElectronWindow } from '../App';
import { ErrorModal } from './ErrorModal';
import { Modal } from './Modal';

interface Props {
    installDir: string;
    onClose: () => void;
    open: boolean;
}

export const DeleteBackupModal: FC<Props> = ({
    installDir,
    onClose,
    open,
}): React.ReactElement => {
    const [backups, setBackups] = useState<
        Array<{
            creationDate: Date;
            filename: string;
            path: string;
        }>
    >([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [deletingBackup, setDeletingBackup] = useState<string>('');
    const [confirmDelete, setConfirmDelete] = useState<string>('');

    const loadBackups = async (): Promise<void> => {
        try {
            setLoading(true);
            const backupsList = await (
                window as ElectronWindow
            ).api.listBackups();
            setBackups(backupsList);
        } catch (err) {
            setError(`Failed to load backups: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBackup = async (backupPath: string): Promise<void> => {
        try {
            setDeletingBackup(backupPath);
            console.log('Backup path is:', backupPath);
            await (window as ElectronWindow).api.deleteBackup(
                'file:deleteBackup',
                backupPath
            );
            // Reload the backups after deletion
            await loadBackups();
        } catch (err) {
            setError(`Failed to delete backup: ${err}`);
        } finally {
            setDeletingBackup('');
            setConfirmDelete('');
        }
    };

    useEffect(() => {
        if (open) {
            loadBackups();
        }
    }, [open]);

    return (
        <>
            <ErrorModal
                errorMessage={error}
                onClose={(): void => setError('')}
                open={error !== ''}
            />

            <Modal
                buttons={[
                    {
                        color: 'neutral',
                        onClick: onClose,
                        text: 'Close',
                    },
                ]}
                modalName="Delete Backup"
                onClose={onClose}
                open={open}
                text={`Select a backup to delete for installation: ${installDir}`}
                width="50%"
            >
                {loading ? (
                    <div className="flex justify-center p-8">
                        <span
                            aria-label="Loading backups"
                            className="loading loading-spinner loading-lg"
                        ></span>
                    </div>
                ) : backups.length === 0 ? (
                    <div className="alert mb-4">
                        <svg
                            className="stroke-info shrink-0 w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                            ></path>
                        </svg>
                        <span>No backups found. Create a backup first.</span>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto bg-base-200 rounded-lg">
                            <table className="table table-zebra w-full">
                                <thead>
                                    <tr>
                                        <th>Backup Name</th>
                                        <th>Creation Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups.map((backup) => (
                                        <tr className="hover" key={backup.path}>
                                            <td>
                                                {backup.filename.replace(
                                                    '.zip',
                                                    ''
                                                )}
                                            </td>
                                            <td>
                                                {new Date(
                                                    backup.creationDate
                                                ).toLocaleString()}
                                            </td>
                                            <td>
                                                {confirmDelete ===
                                                backup.path ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            aria-label={`Confirm deletion of backup: ${backup.filename}`}
                                                            className="btn btn-error btn-sm"
                                                            disabled={
                                                                deletingBackup ===
                                                                backup.path
                                                            }
                                                            onClick={async (): Promise<void> =>
                                                                handleDeleteBackup(
                                                                    backup.path
                                                                )
                                                            }
                                                        >
                                                            {deletingBackup ===
                                                            backup.path ? (
                                                                <>
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                'Confirm'
                                                            )}
                                                        </button>
                                                        <button
                                                            aria-label="Cancel deletion"
                                                            className="btn btn-neutral btn-sm"
                                                            onClick={(): void =>
                                                                setConfirmDelete(
                                                                    ''
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        aria-label={`Delete backup: ${backup.filename}`}
                                                        className="btn btn-error btn-sm"
                                                        onClick={(): void =>
                                                            setConfirmDelete(
                                                                backup.path
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};
