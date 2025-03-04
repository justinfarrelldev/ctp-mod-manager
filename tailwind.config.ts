import type { Config } from 'tailwindcss';

import daisyUI from 'daisyui';

export default {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    daisyui: {
        themes: ['light', 'dark', 'synthwave'],
    },
    plugins: [daisyUI],
    theme: {
        extend: {},
    },
} satisfies Config;
