import {defineConfig, loadEnv} from '@rsbuild/core';
import {pluginReact} from '@rsbuild/plugin-react';
import {pluginSass} from '@rsbuild/plugin-sass';
import {pluginSvgr} from '@rsbuild/plugin-svgr';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

const prepareEnvVars = () => {
    // Load values from .env
    const {parsed} = loadEnv();

    const result: Record<string, string> = {};

    // Additionall stringify vars to prevent errors with invalid symbols
    // rsbuild parses values additionally
    Object.entries(parsed).forEach(([key, value]) => {
        result[key] = JSON.stringify(value);
    });

    return result;
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
    },
    output: {
        distPath: {
            root: './build',
        },
        assetPrefix: '.',
    },
    html: {
        template: './public/index.html',
    },
    tools: {
        rspack(config, {appendPlugins, rspack}) {
            appendPlugins([
                new rspack.DefinePlugin({
                    // Without it vars from .env are not available in index.html
                    'process.env': prepareEnvVars(),
                }),
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
