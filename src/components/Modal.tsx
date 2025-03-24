import React, { FC, useEffect } from 'react';
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
        onClick: () => void;
        text: string;
    }[];
    children?: React.ReactNode;
    height?: string;
    modalName: string;
    onClose: () => void;
    open: boolean;
    text: string;
    width: string;
}

export const Modal: FC<ModalProps> = (
    props: ReadonlyDeep<ModalProps>
): React.ReactElement => {
    // Handle escape key press to close modal
    useEffect(() => {
        const handleEscKey = (event: ReadonlyDeep<KeyboardEvent>): void => {
            if (event.key === 'Escape' && props.open) {
                props.onClose();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [props.open, props.onClose, props]);

    if (!props.open) return null;

    return (
        <dialog
            aria-labelledby={`modal-title-${props.modalName.replace(/\s+/g, '-').toLowerCase()}`}
            aria-modal="true"
            className="modal modal-open"
            id={props.modalName.replace(/\s+/g, '-').toLowerCase()}
        >
            <div
                className="modal-box max-w-3xl"
                style={{ height: props.height, width: props.width }}
            >
                <h3
                    className="text-xl font-bold mb-4"
                    id={`modal-title-${props.modalName.replace(/\s+/g, '-').toLowerCase()}`}
                >
                    {props.modalName}
                </h3>

                {props.text && <p className="mb-4">{props.text}</p>}

                {props.children && <div className="my-4">{props.children}</div>}

                <div className="modal-action mt-6 flex-wrap gap-2">
                    {props.buttons.map((btn, index) => (
                        <button
                            className={`btn btn-${btn.color}`}
                            key={`${btn.text.replace(/\s+/g, '-').toLowerCase()}-${index}`}
                            onClick={btn.onClick}
                        >
                            {btn.text}
                        </button>
                    ))}
                </div>
            </div>

            <form className="modal-backdrop" method="dialog">
                <button
                    aria-label="Close modal"
                    className="cursor-default focus:outline-hidden"
                    onClick={props.onClose}
                >
                    close
                </button>
            </form>
        </dialog>
    );
};
