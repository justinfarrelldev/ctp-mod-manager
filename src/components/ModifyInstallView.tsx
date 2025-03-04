import React, { FC } from 'react';

import { ElectronWindow } from '../App';
import { InstallationPathText } from './InstallationPathText';

type Props = {
    addedMods: string[]; // Mods that have been added to the Mods folder by the user
    dirBeingModified: string;
    onBackClicked: () => void;
    onDequeueMod: (modName: string) => Promise<void>;
    onModSelected: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    onOpenModsDir: () => void;
    onQueueMod: (modName: string) => Promise<void>;
    queuedMods: string[]; // Mods actually queued to be applied
};

export const ModifyInstallView: FC<Props> = ({
    addedMods,
    dirBeingModified,
    onBackClicked,
    onDequeueMod,
    onModSelected,
    onOpenModsDir,
    onQueueMod,
    queuedMods,
}): React.ReactElement => {
    return (
        <div>
            <InstallationPathText dir={dirBeingModified} />
        </div>
    );
};
