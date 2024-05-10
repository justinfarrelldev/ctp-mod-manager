import React, { FC } from 'react';
import { Modal, ModalProps } from './Modal';
import { Typography } from '@mui/material';

interface Props {
    errorMessage: string;
    open: boolean;
    onClose: () => void;
}

export const ErrorModal: FC<Props> = (props: Props): React.ReactElement => {
    return (
        <Modal
            width="50%"
            open={props.open}
            onClose={props.onClose}
            modalName="An Error Occurred"
            text={`The error: ${props.errorMessage}\n\nPlease try again and feel free to submit an issue if this
            problem persists.`}
            buttons={[
                {
                    text: 'Close',
                    onClick: props.onClose,
                    color: 'neutral',
                },
            ]}
        />
    );
};
