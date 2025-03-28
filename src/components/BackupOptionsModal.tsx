import React, { FC } from 'react';

import { Modal } from './Modal';

interface BackupOptionsModalProps {
    creatingBackup: string;
    installDir: string;
    onClickCreateBackup: (dir: string) => Promise<void>;
    onClickDeleteBackup: (dir: string) => void;
    onClickRestoreBackup: (dir: string) => void;
    onClose: () => void;
    open: boolean;
}

export const BackupOptionsModal: FC<BackupOptionsModalProps> = ({
    creatingBackup,
    installDir,
    onClickCreateBackup,
    onClickDeleteBackup,
    onClickRestoreBackup,
    onClose,
    open,
}) => {
    return (
        <Modal
            buttons={[
                {
                    color: 'neutral',
                    onClick: onClose,
                    text: 'Close',
                },
            ]}
            modalName="Backup Options"
            onClose={onClose}
            open={open}
            text=""
            width="300px"
        >
            <div className="flex flex-col gap-3">
                <button
                    aria-label="Restore backup"
                    className="btn btn-primary w-full"
                    onClick={(): void => onClickRestoreBackup(installDir)}
                >
                    Restore Backup
                </button>
                <button
                    aria-label="Create backup"
                    className="btn btn-primary w-full"
                    disabled={creatingBackup === installDir}
                    onClick={async (): Promise<void> =>
                        onClickCreateBackup(installDir)
                    }
                >
                    {creatingBackup === installDir ? (
                        <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Creating...
                        </>
                    ) : (
                        'Create Backup'
                    )}
                </button>
                <button
                    aria-label="Delete backup"
                    className="btn btn-error w-full"
                    onClick={(): void => onClickDeleteBackup(installDir)}
                >
                    Delete Backup
                </button>
            </div>
        </Modal>
    );
};
