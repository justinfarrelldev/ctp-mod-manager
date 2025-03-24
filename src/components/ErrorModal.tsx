import React, { FC } from 'react';
import { ReadonlyDeep } from 'type-fest';

import { Modal } from './Modal';

interface Props {
    errorMessage: string;
    onClose: () => void;
    open: boolean;
}

export const ErrorModal: FC<Props> = (
    props: ReadonlyDeep<Props>
): React.ReactElement => {
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
            text=""
            width="50%"
        >
            <div className="alert alert-error shadow-lg">
                <svg
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                    />
                </svg>
                <div>
                    <h3 className="font-bold">Error</h3>
                    <div className="text-xs">{props.errorMessage}</div>
                </div>
            </div>

            <p className="mt-4">
                Please try again and feel free to submit an issue if this
                problem persists.
            </p>
        </Modal>
    );
};
