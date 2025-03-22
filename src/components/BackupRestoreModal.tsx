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
                        {error && (
                            <div className="alert alert-error mb-4">
                                <svg
                                    className="stroke-current shrink-0 h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                    />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        <p className="mb-4">
                            Select a backup to restore to{' '}
                            <code className="bg-base-300 px-1 py-0.5 rounded">
                                {installDir}
                            </code>
                            :
                        </p>
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
                                                {getBackupName(backup.filename)}
                                            </td>
                                            <td>
                                                {formatDate(
                                                    backup.creationDate
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    aria-label={`Restore backup: ${getBackupName(backup.filename)}`}
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
                        <div className="flex justify-center mt-2">
                            <span
                                aria-label="Restoring backup"
                                className="loading loading-bars loading-md"
                            ></span>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};
