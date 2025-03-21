import React, { FC, useEffect, useState } from 'react';
import { ReadonlyDeep } from 'type-fest';

import { ElectronWindow } from '../App';
import { Modal } from './Modal';

interface BackupInfo {
    creationDate: Date;
    filename: string;
    path: string;
}

interface BackupRestoreModalProps {
    installDir: string;
    onClose: () => void;
    open: boolean;
}

export const BackupRestoreModal: FC<BackupRestoreModalProps> = ({
    installDir,
    onClose,
    open,
}): React.ReactElement => {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(
        null
    );
    const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
    const [restoring, setRestoring] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const loadBackups = async (): Promise<void> => {
        setLoading(true);
        try {
            const backupFiles = await (
                window as ElectronWindow
            ).api.listBackups();
            setBackups(backupFiles);
        } catch (err) {
            console.error('Failed to load backups:', err);
            setError('Failed to load backups');
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreBackup = async (): Promise<void> => {
        if (!selectedBackup) return;

        setRestoring(true);
        try {
            await (window as ElectronWindow).api.restoreBackup(
                'file:restoreBackup',
                selectedBackup.path,
                installDir
            );
            setConfirmOpen(false);
            onClose();
        } catch (err) {
            console.error('Failed to restore backup:', err);
            setError(`Failed to restore backup: ${err}`);
        } finally {
            setRestoring(false);
        }
    };

    // Load backups when the modal opens
    useEffect(() => {
        if (open) {
            loadBackups();
        }
    }, [open]);

    const formatDate = (date: ReadonlyDeep<Date>): string => {
        return new Date(date).toLocaleString();
    };

    const getBackupName = (filename: string): string => {
        // Extract a readable name from the backup filename
        return filename.replace('.zip', '');
    };

    return (
        <>
            <Modal
                buttons={[
                    {
                        color: 'neutral',
                        onClick: onClose,
                        text: 'Close',
                    },
                ]}
                modalName="Restore Backup"
                onClose={onClose}
                open={open}
                text=""
                width="70%"
            >
                {loading ? (
                    <span className="loading loading-bars loading-md block"></span>
                ) : backups.length === 0 ? (
                    <p>No backups found. Create a backup first.</p>
                ) : (
                    <>
                        {error && (
                            <div className="alert alert-error mb-4">
                                {error}
                            </div>
                        )}
                        <p className="mb-4">
                            Select a backup to restore to{' '}
                            <strong>{installDir}</strong>:
                        </p>
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
                                                {getBackupName(backup.filename)}
                                            </td>
                                            <td>
                                                {formatDate(
                                                    backup.creationDate
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={(): void => {
                                                        setSelectedBackup(
                                                            backup
                                                        );
                                                        setConfirmOpen(true);
                                                    }}
                                                >
                                                    Restore
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </Modal>

            <Modal
                buttons={[
                    {
                        color: 'error',
                        onClick: handleRestoreBackup,
                        text: 'Yes, Restore',
                    },
                    {
                        color: 'neutral',
                        onClick: () => setConfirmOpen(false),
                        text: 'Cancel',
                    },
                ]}
                modalName="Confirm Restore"
                onClose={(): void => setConfirmOpen(false)}
                open={confirmOpen}
                text={`Are you sure you want to restore this backup? This will completely replace your current installation at ${installDir}.`}
                width="50%"
            >
                {restoring && (
                    <div className="mt-4">
                        <p>Restoring backup, please wait...</p>
                        <span className="loading loading-bars loading-md block"></span>
                    </div>
                )}
            </Modal>
        </>
    );
};
