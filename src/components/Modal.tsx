import React, { FC } from 'react';

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
                <p className="pb-4 text-xl font-bold">{props.modalName}</p>
                <p className="text-l">{props.text}</p>
                {props.children && <>{props.children}</>}
                <div className="flex justify-between pt-4">
                    {props.buttons.map((btn) => (
                        <button
                            key={btn.text.replaceAll(' ', '')}
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
