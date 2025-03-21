import React, { FC } from 'react';
import { ReadonlyDeep } from 'type-fest';

export interface ModalProps {
    buttons: {
        color:
            | 'accent'
            | 'error'
            | 'info'
            | 'neutral'
            | 'primary'
            | 'secondary'
            | 'success'
            | 'warning';
        onClick: () => any;
        text: string;
    }[];
    children?: React.ReactNode;
    height?: string;
    modalName: string;
    onClose: () => any;
    open: boolean;
    text: string;
    width: string;
}

export const Modal: FC<ModalProps> = (
    props: ReadonlyDeep<ModalProps>
): React.ReactElement => {
    return (
        <dialog className="modal" id={props.modalName} open={props.open}>
            <div className="modal-box">
                <p className="pb-4 text-xl font-bold">{props.modalName}</p>
                <p className="text-l">{props.text}</p>
                {props.children && <>{props.children}</>}
                <div className="flex justify-between pt-4">
                    {props.buttons.map((btn) => (
                        <button
                            className={`btn btn-${btn.color}`}
                            key={btn.text.replaceAll(' ', '')}
                            onClick={btn.onClick}
                        >
                            {btn.text}
                        </button>
                    ))}
                </div>
            </div>
            <form className="modal-backdrop" method="dialog">
                <button onClick={props.onClose}>close</button>
            </form>
        </dialog>
    );
};
