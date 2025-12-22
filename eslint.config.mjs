import baseConfig from '@gravity-ui/eslint-config';
import importOrderConfig from '@gravity-ui/eslint-config/import-order';
import prettierConfig from '@gravity-ui/eslint-config/prettier';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    {
        plugins: {
            import: importPlugin,
            'react-hooks': reactHooks,
        },
    },
    ...baseConfig,
    ...importOrderConfig,
    ...prettierConfig,
    {
        files: ['**/*.js'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaFeatures: {jsx: true},
            },
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        },
    },
    {
        files: ['commitlint.config.js', 'src/setupProxy.js', '.github/**/*', 'babel.config.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    // Common rules for all JavaScript and TypeScript files
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        rules: {
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            curly: ['error', 'all'],
            'react-hooks/exhaustive-deps': 'warn',
            'react-hooks/rules-of-hooks': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "ImportDeclaration[source.value='react'] :matches(ImportNamespaceSpecifier, ImportDefaultSpecifier:not([local.name='React']), ImportSpecifier)",
                    message: "Please use import React from 'react' instead.",
                },
                {
                    selector: 'JSXFragment>JSXOpeningFragment:not(:has(JSXIdentifier))',
                    message: 'Please use React.Fragment instead.',
                },
            ],
        },
    },
    // TypeScript-specific rules that require type information
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
        },
        settings: {
            'import/resolver': {
                typescript: {
                    // for some reason only glob pattern tsconfig works in vscode
                    project: 'src/*/tsconfig.json',
                },
            },
        },
    },
    {ignores: ['dist', 'build']},
];
