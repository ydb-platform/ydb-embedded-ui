import {defineConfig, loadEnv} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import {pluginSass} from '@rsbuild/plugin-sass';
import {pluginSvgr} from '@rsbuild/plugin-svgr';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

/**
 * List of environment variables that should be accessible in HTML and JavaScript files.
 * These variables are injected into the client-side code via process.env definitions.
 */
const APP_VARS = [
    'DISABLE_ESLINT_PLUGIN',
    'TSC_COMPILE_ON_ERROR',
    'REACT_APP_DISABLE_CHECKS',

    'NODE_ENV',

    // Backend configuration
    'REACT_APP_BACKEND',
    'REACT_APP_META_BACKEND',
    'META_YDB_BACKEND',
];

/**
 * Prepares environment variables to be exposed in client-side code.
 *
 * This function:
 * 1. Loads environment variables from .env files using rsbuild's loadEnv()
 * 2. Explicitly checks process.env for each variable (prioritizes process.env over .env file values)
 * 3. Stringifies values for safe injection into JavaScript code via source.define
 *
 * CRITICAL FOR CI: We must explicitly pass process.env variables to source.define,
 * otherwise they are not accessible in client code in CI (GitHub Actions).
 * rsbuild's loadEnv() only reads from .env files, not from process.env by default.
 */
const prepareEnvVars = () => {
    // Load values from .env files (if they exist)
    const {parsed} = loadEnv();

    const result: Record<string, string> = {};

    APP_VARS.forEach((name) => {
        // Priority: process.env > .env file
        // This ensures CI-provided env vars (from GitHub Actions, Playwright webServer, etc.)
        // take precedence over .env file values
        const value = process.env[name] ?? parsed[name];
        // Stringify for safe injection into JavaScript code
        result[name] = JSON.stringify(value);
    });

    return {
        // Without this, environment variables would not be available in index.html or JavaScript
        'process.env': result,
    };
};

export default defineConfig({
    plugins: [
        pluginReact(),
        pluginSass(),
        pluginSvgr({
            svgrOptions: {
                exportType: 'default',
            },
        }),
    ],
    source: {
        entry: {
            index: './src/index.tsx',
        },
        include: [
            'node_modules/antlr4-c3',
            'node_modules/@gravity-ui/websql-autocomplete',
            'node_modules/antlr4ng',
        ],
        define: prepareEnvVars(),
    },
    output: {
        distPath: {
            root: './build',
        },
        assetPrefix: '.',
        sourceMap: {
            js: process.env.GENERATE_SOURCEMAP !== 'false' ? 'source-map' : false,
        },
    },
    html: {
        template: './public/index.html',
    },
    tools: {
        rspack(config, {appendPlugins}) {
            appendPlugins([
                new MonacoWebpackPlugin({
                    languages: ['yaml'],
                    customLanguages: [
                        {
                            label: 'yql',
                            entry: 'monaco-yql-languages/build/monaco.contribution',
                        },
                    ],
                }),
            ]);

            return config;
        },
    },
});
