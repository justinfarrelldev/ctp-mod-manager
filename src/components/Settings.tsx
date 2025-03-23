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
                    <label className="label" htmlFor="theme-select">
                        <span className="label-text text-lg">Theme</span>
                    </label>
                    <select
                        className="select select-bordered w-full max-w-xs"
                        data-choose-theme
                        id="theme-select"
                    >
                        <option value="light">Default (Light)</option>
                        <option value="dark">Dark</option>
                        <option value="synthwave">Synthwave</option>
                        <option value="cupcake">Cupcake</option>
                        <option value="bumblebee">Bumblebee</option>
                        <option value="emerald">Emerald</option>
                        <option value="corporate">Corporate</option>
                        <option value="retro">Retro</option>
                        <option value="cyberpunk">Cyberpunk</option>
                        <option value="valentine">Valentine</option>
                        <option value="halloween">Halloween</option>
                        <option value="garden">Garden</option>
                        <option value="forest">Forest</option>
                        <option value="aqua">Aqua</option>
                        <option value="lofi">LoFi</option>
                        <option value="pastel">Pastel</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="wireframe">Wireframe</option>
                        <option value="black">Black</option>
                        <option value="luxury">Luxury</option>
                        <option value="dracula">Dracula</option>
                        <option value="cmyk">CMYK</option>
                        <option value="autumn">Autumn</option>
                        <option value="business">Business</option>
                        <option value="acid">Acid</option>
                        <option value="lemonade">Lemonade</option>
                        <option value="night">Night</option>
                        <option value="coffee">Coffee</option>
                        <option value="winter">Winter</option>
                    </select>
                    <span className="label-text-alt mt-1">
                        Change the application&apos;s visual theme
                    </span>
                </div>
            </section>

            {/* Additional settings sections can be added here */}
        </div>
    );
};
