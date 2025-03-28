import React, { FC, useEffect, useState } from 'react';

import { Modal } from './Modal';

interface Props {
    defaultName?: string;
    installDir: string;
    onClose: () => void;
    onConfirm: (backupName: string) => void;
    open: boolean;
}

export const BackupNameModal: FC<Props> = ({
    defaultName,
    installDir,
    onClose,
    onConfirm,
    open,
}) => {
    const [backupName, setBackupName] = useState('');
    const [error, setError] = useState<null | string>(null);

    useEffect(() => {
        if (open) {
            const initialName =
                defaultName ||
                `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
            setBackupName(initialName);
            setError(null);
        }
    }, [open, defaultName]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Prevent spaces by replacing them with underscores
        const sanitizedValue = value.replace(/\s/g, '_');

        if (value !== sanitizedValue) {
            setError(
                'Spaces are not allowed and have been replaced with underscores'
            );
        } else {
            setError(null);
        }

        setBackupName(sanitizedValue);
    };

    return (
        <Modal
            buttons={[
                {
                    color: 'primary',
                    disabled: !backupName.trim(),
                    onClick: () => {
                        onConfirm(backupName);
                    },
                    text: 'Create Backup',
                },
                {
                    color: 'neutral',
                    onClick: onClose,
                    text: 'Cancel',
                },
            ]}
            modalName="Create Backup"
            onClose={onClose}
            open={open}
            text=""
            width="50%"
        >
            <div className="space-y-4">
                <p>
                    Create a backup for:{' '}
                    <span className="font-semibold break-all">
                        {installDir}
                    </span>
                </p>

                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Backup Name</span>
                    </label>
                    <input
                        className="input input-bordered w-full"
                        onChange={handleNameChange}
                        placeholder="Enter backup name"
                        type="text"
                        value={backupName}
                    />
                    {error && (
                        <label className="label">
                            <span className="label-text-alt text-error">
                                {error}
                            </span>
                        </label>
                    )}
                </div>

                <div className="text-sm text-base-content/70">
                    The backup will be created with this name. It can be
                    restored later if needed. Note: Spaces are not allowed and
                    will be automatically replaced with underscores.
                </div>
            </div>
        </Modal>
    );
};
