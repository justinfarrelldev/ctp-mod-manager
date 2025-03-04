import React, { FC } from 'react';

import { Modal } from './Modal';

interface Props {
    errorMessage: string;
    onClose: () => void;
    open: boolean;
}

export const ErrorModal: FC<Props> = (props: Props): React.ReactElement => {
    return (
        <Modal
            buttons={[
                {
                    color: 'neutral',
                    onClick: props.onClose,
                    text: 'Close',
                },
            ]}
            modalName="An Error Occurred"
            onClose={props.onClose}
            open={props.open}
            text={`The error: ${props.errorMessage}\n\nPlease try again and feel free to submit an issue if this
            problem persists.`}
            width="50%"
        />
    );
};
