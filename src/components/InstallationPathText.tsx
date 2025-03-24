import React, { FC } from 'react';
import { ReadonlyDeep } from 'type-fest';

type Props = {
    dir: string;
    installationType?: 'gog' | 'steam';
};

export const InstallationPathText: FC<Props> = (props: ReadonlyDeep<Props>) => (
    <div className="flex items-center gap-2">
        {props.installationType && (
            <span className="badge badge-outline font-semibold">
                {props.installationType.toUpperCase()}
            </span>
        )}
        <span className="text-base text-opacity-90 break-all">{props.dir}</span>
    </div>
);
