import Cookie from 'js-cookie';
import React, { FC, useEffect, useState } from 'react';
import { themeChange } from 'theme-change';

// TODO finish this after configuring the proper locations within the Electron-side

const MOD_STORAGE_DIR_COOKIE_NAME = 'modStorageDirectory';
const INITIAL_MOD_STORAGE_DIR = ''; // TODO eventually replace this with Linux and Mac as well

const initialModStorageCookie =
    Cookie.get(MOD_STORAGE_DIR_COOKIE_NAME) === undefined
        ? ''
        : Cookie.get(MOD_STORAGE_DIR_COOKIE_NAME);

export const Settings: FC = (): React.ReactElement => {
    useEffect(() => {
        themeChange(false);
        // 👆 false parameter is required for react project
    }, []);

    return (
        <>
            <p className="text-xl">General Settings</p>
            <p className="text-lg">Theme</p>
            <select data-choose-theme>
                <option value="light">Default</option>
                <option value="dark">Dark</option>
                <option value="synthwave">Synthwave</option>
            </select>
        </>
    );
};
