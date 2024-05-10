import React, { FC } from 'react';
import {
    Box,
    Modal as MuiModal,
    ModalProps as MuiModalProps,
} from '@mui/material';

const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export interface ModalProps {
    width: string;
    height?: string;
    text: string;
    modalName: string;
    buttons: {
        text: string;
        onClick: () => any;
        color: 'primary' | 'secondary' | 'accent' | 'neutral';
    }[];
    children?: React.ReactNode;
    open: boolean;
    onClose: () => any;
}

export const Modal: FC<ModalProps> = (
    props: ModalProps
): React.ReactElement => {
    return (
        <dialog id={props.modalName} className="modal" open={props.open}>
            <div className="modal-box">
                <p className="text-xl">{props.modalName}</p>
                <p className="text-l">{props.text}</p>
                {props.children && <>{props.children}</>}
                <div className="flex justify-between">
                    {props.buttons.map((btn) => (
                        <button
                            className={`btn btn-${btn.color}`}
                            onClick={btn.onClick}
                        >
                            {btn.text}
                        </button>
                    ))}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={props.onClose}>close</button>
            </form>
        </dialog>
    );
};
