import React, { FC, useState } from 'react';
import Cookie from 'js-cookie';

// TODO finish this after configuring the proper locations within the Electron-side

const MOD_STORAGE_DIR_COOKIE_NAME = 'modStorageDirectory';
const INITIAL_MOD_STORAGE_DIR = ''; // TODO eventually replace this with Linux and Mac as well

const initialModStorageCookie =
    Cookie.get(MOD_STORAGE_DIR_COOKIE_NAME) === undefined
        ? ''
        : Cookie.get(MOD_STORAGE_DIR_COOKIE_NAME);

export const Settings: FC = (): React.ReactElement => {
    const [modStorageDirectory, setModStorageDirectory] = useState<string>();

    return (
        <>
            <p className="text-xl">General Settings</p>
            <p className="text-lg">Theme</p>
            <div className="dropdown">
                <div tabIndex={0} role="button" className="btn m-1">
                    Click
                </div>
                <ul
                    tabIndex={0}
                    className="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
                >
                    <li>
                        <a onClick={() => alert('clicked 1')}>Item 1</a>
                    </li>
                    <li>
                        <a onClick={() => alert('clicked 2')}>Item 2</a>
                    </li>
                </ul>
            </div>
        </>
    );
};
