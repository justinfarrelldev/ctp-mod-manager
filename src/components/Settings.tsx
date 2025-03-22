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
        <div className="space-y-6">
            <section>
                <h3 className="text-xl font-semibold mb-4">General Settings</h3>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text text-lg">Theme</span>
                    </label>
                    <select
                        aria-label="Select theme"
                        className="select select-bordered w-full max-w-xs"
                        data-choose-theme
                    >
                        <option value="light">Default (Light)</option>
                        <option value="dark">Dark</option>
                        <option value="synthwave">Synthwave</option>
                    </select>
                    <span className="label-text-alt mt-1">
                        Change the application's visual theme
                    </span>
                </div>
            </section>

            {/* Additional settings sections can be added here */}
        </div>
    );
};
