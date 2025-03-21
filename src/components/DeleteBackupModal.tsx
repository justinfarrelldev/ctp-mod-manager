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
                onClose={() => setError('')}
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
                    <span className="loading loading-bars loading-md block"></span>
                ) : backups.length === 0 ? (
                    <p>No backups found. Create a backup first.</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
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
                                        <tr key={backup.path}>
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
                                                    <div className="flex space-x-2">
                                                        <button
                                                            className="btn btn-error btn-sm"
                                                            disabled={
                                                                deletingBackup ===
                                                                backup.path
                                                            }
                                                            onClick={() =>
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
                                                            className="btn btn-neutral btn-sm"
                                                            onClick={() =>
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
                                                        className="btn btn-error btn-sm"
                                                        onClick={() =>
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
