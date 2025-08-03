import React, { FC, useCallback, useState } from 'react';

import { Modal } from './Modal';

interface ReleaseNotesModalProps {
    onClose: (dontShowAgain: boolean) => void;
    open: boolean;
}

export const ReleaseNotesModal: FC<ReleaseNotesModalProps> = ({
    onClose,
    open,
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleClose = useCallback(() => {
        onClose(dontShowAgain);
    }, [dontShowAgain, onClose]);

    const releaseNotes = [
        '🎯 **CTP1 Support**: Added support for Call to Power 1 alongside CTP2 (consider this support **unstable**, and see next bullet point)',
        '❌ **IMPORTANT**: Many CTP1 mods are still incompatible - Forever Future was successfully installed, however, and some mods will simply need repacked to work',
        '🛡️ **Enhanced Error Handling**: Improved error reporting and handling throughout the mod application process',
        '📋 **Mods.json Management**: Better handling of mod tracking files with legacy format support',
        '🚀 **Permission Handling**: Enhanced mod installation process with better permission error handling',
        '🔧 **Code Quality**: Comprehensive test coverage additions and code formatting improvements',
        '📚 **Documentation**: Updated development guidelines and contributor instructions',
        '🐛 **Bug Fixes**: Various stability improvements and issue resolutions',
    ];

    return (
        <Modal
            buttons={[
                {
                    color: 'primary',
                    onClick: handleClose,
                    text: 'Close',
                },
            ]}
            modalName="What's New in v0.7.0 Beta"
            onClose={handleClose}
            open={open}
            text=""
            width="60%"
        >
            <div className="space-y-4">
                <div className="alert alert-info">
                    <svg
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                        />
                    </svg>
                    <div>
                        <h3 className="font-bold">New Release: v0.7.0 Beta</h3>
                        <div className="text-sm">
                            Thank you for using Call to Power Mod Manager!
                        </div>
                    </div>
                </div>

                <div className="prose max-w-none">
                    <h4 className="text-lg font-semibold mb-3">
                        What&apos;s New:
                    </h4>
                    <ul className="space-y-2">
                        {releaseNotes.map((note, index) => (
                            <li
                                className="flex items-start space-x-2"
                                key={index}
                            >
                                <span className="text-primary">•</span>
                                <span>
                                    {note
                                        .split(/\*\*(.*?)\*\*/g)
                                        .map((part, i) =>
                                            i % 2 === 1 ? (
                                                <strong key={i}>{part}</strong>
                                            ) : (
                                                part
                                            )
                                        )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="divider"></div>

                <div className="flex items-center space-x-3">
                    <label className="cursor-pointer flex items-center space-x-2">
                        <input
                            checked={dontShowAgain}
                            className="checkbox checkbox-primary"
                            onChange={(e): void =>
                                setDontShowAgain(e.target.checked)
                            }
                            type="checkbox"
                        />
                        <span className="text-sm">
                            Don&apos;t show this again
                        </span>
                    </label>
                </div>
            </div>
        </Modal>
    );
};
