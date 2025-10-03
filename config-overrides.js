const path = require('path');

const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const srcRoot = path.resolve(__dirname, 'src');
const uiKitRoot = path.resolve(__dirname, 'node_modules/@gravity-ui/uikit');
const antlr4C3Root = path.resolve(__dirname, 'node_modules/antlr4-c3');
const websqlRoot = path.resolve(__dirname, 'node_modules/@gravity-ui/websql-autocomplete');
const antlr4ngRoot = path.resolve(__dirname, 'node_modules/antlr4ng');
const uiKitIconsRoot = path.resolve(__dirname, 'node_modules/@gravity-ui/icons');

module.exports = {
    webpack: (config, env) => {
        const oneOfRule = config.module.rules.find((r) => r.oneOf);

        oneOfRule.oneOf.splice(0, 0, {
            test: /\.svg$/,
            include: [
                path.resolve(srcRoot, 'assets/icons'),
                path.resolve(srcRoot, 'assets/illustrations'),
                path.resolve(uiKitRoot, 'assets/icons'),
                uiKitIconsRoot,
            ],
            loader: '@svgr/webpack',
            options: {dimensions: false},
        });

        oneOfRule.oneOf.splice(1, 0, {
            test: [/\.[jt]sx?$/, /\.[cm]js$/],
            include: [antlr4C3Root, websqlRoot, antlr4ngRoot],
            loader: 'babel-loader',
            options: {babelrc: false, configFile: false, compact: true},
        });

        if (env === 'production') {
            config.output.path = path.resolve(__dirname, 'build/');
        }
        config.plugins.push(
            new MonacoWebpackPlugin({
                languages: ['yaml'],
                customLanguages: [
                    {
                        label: 'yql',
                        entry: 'monaco-yql-languages/build/monaco.contribution',
                    },
                ],
            }),
        );

        const cssExtractPlugin = config.plugins.find((p) => p instanceof MiniCSSExtractPlugin);
        if (cssExtractPlugin) {
            cssExtractPlugin.options.ignoreOrder = true;
        }

        return config;
    },
    jest: (config) => {
        // Some @gravity-ui libs (react-data-table, paranoid) are build in esm only
        // So they need to be transformed
        // By default jest does not transform anything in node_modules
        // So this override excludes node_modules except @gravity-ui
        // see https://github.com/timarney/react-app-rewired/issues/241
        config.transformIgnorePatterns = [
            'node_modules/(?!(@gravity-ui|@mjackson|@standard-schema)/)',
        ];

        // Add .github directory to roots
        config.roots = ['<rootDir>/src', '<rootDir>/.github'];

        // Update testMatch to include .github directory
        config.testMatch = [
            '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
            '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
            '<rootDir>/.github/**/*.{spec,test}.{js,jsx,ts,tsx}',
        ];

        return config;
    },
};
