import type { ForgeConfig } from '@electron-forge/shared-types';

import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';

const config: ForgeConfig = {
    makers: [
        new MakerSquirrel({
            setupExe: 'ctp-mod-manager-${arch}-v${version}-setup.exe',
        }),
        new MakerZIP({}, ['darwin']),
        new MakerRpm({}),
        new MakerDeb({}),
        new MakerDMG({}),
    ],
    packagerConfig: {
        asar: true,
        ignore: [/^\/node_modules$/],
    },
    plugins: [
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    config: 'vite.main.config.ts',
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/electron/main.ts',
                },
                {
                    config: 'vite.preload.config.ts',
                    entry: 'src/electron/preload.ts',
                },
            ],
            renderer: [
                {
                    config: 'vite.renderer.config.ts',
                    name: 'main_window',
                },
            ],
        }),
    ],
    rebuildConfig: {},
};

export default config;
