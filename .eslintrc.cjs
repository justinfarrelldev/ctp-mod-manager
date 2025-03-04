const vitest = require('eslint-plugin-vitest');

module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es6: true,
    },
    // Base config
    extends: [
        'eslint:recommended',
        'plugin:import/recommended',
        'plugin:react/recommended',
        // Need to add this plugin back once Tailwind v4 migration is over: https://github.com/francoismassart/eslint-plugin-tailwindcss/issues/384
        // 'plugin:tailwindcss/recommended',
        'plugin:perfectionist/recommended-natural-legacy',
        'plugin:jsdoc/recommended-typescript',
    ],
    ignorePatterns: ['!**/.server', '!**/.client'],
    overrides: [
        // React
        {
            extends: [
                'plugin:react/recommended',
                'plugin:react/jsx-runtime',
                'plugin:react-hooks/recommended',
                'plugin:jsx-a11y/recommended',
                'plugin:css/recommended',
            ],
            files: ['**/*.{js,jsx,ts,tsx}'],
            plugins: ['react', 'jsx-a11y', 'css'],
            settings: {
                formComponents: ['Form'],
                'import/resolver': {
                    typescript: {},
                },
                linkComponents: [
                    { linkAttribute: 'to', name: 'Link' },
                    { linkAttribute: 'to', name: 'NavLink' },
                ],
                react: {
                    version: 'detect',
                },
            },
        },

        // Typescript
        {
            extends: [
                'plugin:@typescript-eslint/recommended',
                'plugin:import/recommended',
                'plugin:import/typescript',
                'plugin:functional/recommended',
                'plugin:functional/stylistic',
            ],
            files: ['**/*.{ts,tsx}', '*.{ts,tsx}'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: true,
            },
            plugins: ['@typescript-eslint', 'import', 'prefer-arrow'],
            rules: {
                '@typescript-eslint/explicit-function-return-type': 'error',
                '@typescript-eslint/no-explicit-any': 'error',
                'functional/functional-parameters': 'off',
                'functional/immutable-data': 'off',
                'functional/no-conditional-statements': 'off',
                'functional/no-expression-statements': 'off',
                'functional/no-let': 'off',
                'functional/no-return-void': 'off',
                'functional/prefer-immutable-types': 'error',
                'no-undef': 'off',
                'no-unused-vars': 'off',
                'prefer-arrow/prefer-arrow-functions': [
                    'warn',
                    {
                        classPropertiesAllowed: false,
                        disallowPrototype: true,
                        singleReturnOnly: false,
                    },
                ],
            },
            settings: {
                'import/internal-regex': '^~/',
                'import/resolver': {
                    node: {
                        extensions: ['.ts', '.tsx'],
                    },
                    typescript: {
                        alwaysTryTypes: true,
                    },
                },
            },
        },

        // Node
        {
            env: {
                node: true,
            },
            files: ['.eslintrc.cjs'],
        },
        // no unsanitized
        {
            files: ['**/*.{js,jsx,ts,tsx}'],
            plugins: ['no-unsanitized'],
            rules: {
                'no-undef': 'off',
                'no-unsanitized/method': 'error',
                'no-unsanitized/property': 'error',
                'no-unused-vars': 'off',
            },
        },
        // functional programming
        {
            extends: [
                'plugin:functional/recommended',
                'plugin:functional/stylistic',
                'eslint:recommended',
                'plugin:react/recommended',
                // 'plugin:tailwindcss/recommended',
                'plugin:perfectionist/recommended-natural-legacy',
                'plugin:jsdoc/recommended-typescript',
            ],
            files: ['./app/utils/*.{js,jsx,ts,tsx}', '*.{ts,tsx}'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: true,
            },
            plugins: ['functional'],
            rules: {
                'functional/functional-parameters': 'off',
                'functional/immutable-data': 'off',
                'functional/no-conditional-statements': 'off',
                'functional/no-expression-statements': [
                    'off',
                    {
                        ignoreVoid: true,
                    },
                ],
                'functional/no-let': 'off',
                'functional/no-loop-statements': 'off',
                'functional/no-return-void': 'off',
                'functional/no-throw-statements': 'off',
                'no-undef': 'off',
                'no-unused-vars': 'off',
            },
        },
        // Tests
        {
            extends: [
                'plugin:functional/recommended',
                'plugin:functional/stylistic',
                'eslint:recommended',
                'plugin:react/recommended',
                // 'plugin:tailwindcss/recommended',
                'plugin:perfectionist/recommended-natural-legacy',
                'plugin:jsdoc/recommended-typescript',
            ],
            files: ['**/*.test.{ts,tsx}'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: true,
            },
            plugins: ['functional', 'vitest'],
            rules: {
                ...vitest.configs.all.rules,
                'functional/functional-parameters': 'off',

                'functional/no-expression-statements': 'off',
                'functional/no-let': 'off',
                'functional/no-return-void': 'off',
                'no-undef': 'off',
                'no-unused-vars': 'off',
                'vitest/no-hooks': 'off',
            },
        },
    ],

    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
    },

    root: true,
    rules: {
        // 'tailwindcss/classnames-order': 'off',
        '@typescript-eslint/explicit-function-return-type': 'error',
        'functional/no-let': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
    },
};
