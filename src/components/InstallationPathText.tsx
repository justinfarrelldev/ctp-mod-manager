import React, { FC } from 'react';

type Props = {
    dir: string;
    installationType?: 'gog' | 'steam';
};

export const InstallationPathText: FC<Props> = (props: Props) => (
    <div className="flex justify-start space-x-4">
        {props.installationType && (
            <p className="text-lg font-bold text-primary">{`[${props.installationType.toUpperCase()}]`}</p>
        )}
        <p className="text-lg text-primary">{`${props.dir}`}</p>
    </div>
);
