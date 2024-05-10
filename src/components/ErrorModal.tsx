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
            modalName="An error occurred"
        >
            <>
                <Typography variant="h3">An Error Occurred</Typography>
                <Typography>{props.errorMessage}</Typography>
                <br></br>
                <Typography>
                    Please try again and feel free to submit an issue if this
                    problem persists.
                </Typography>
            </>
        </Modal>
    );
};
