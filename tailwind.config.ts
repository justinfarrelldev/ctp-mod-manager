import type { Config } from 'tailwindcss';
import daisyUI from 'daisyui';

export default {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {},
    },
    plugins: [daisyUI],
    daisyui: {
        themes: ['light', 'dark', 'synthwave'],
    },
} satisfies Config;
