import React, { FC } from 'react';
import { ElectronWindow } from '../App';
import { InstallationPathText } from './InstallationPathText';

type Props = {
    onBackClicked: () => void;
    dirBeingModified: string;
    onModSelected: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    onQueueMod: (modName: string) => Promise<void>;
    onDequeueMod: (modName: string) => Promise<void>;
    queuedMods: string[]; // Mods actually queued to be applied
    addedMods: string[]; // Mods that have been added to the Mods folder by the user
    onOpenModsDir: () => void;
};

export const ModifyInstallView: FC<Props> = ({
    onBackClicked,
    dirBeingModified,
    onModSelected,
    onQueueMod,
    queuedMods,
    addedMods,
    onDequeueMod,
    onOpenModsDir,
}): React.ReactElement => {
    const applyMods = (installDirToApplyTo: string) => {
        (window as ElectronWindow).api.makeBackup(
            'file:makeBackup',
            installDirToApplyTo
        );
        (window as ElectronWindow).api.applyModsToInstall(
            'file:applyModsToInstall',
            installDirToApplyTo,
            queuedMods
        );
    };

    return (
        <div>
            <InstallationPathText dir={dirBeingModified} />
        </div>
    );
};
