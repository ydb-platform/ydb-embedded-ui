const path = require('path');

const srcRoot = path.resolve(__dirname, 'src');
const uiKitRoot = path.resolve(__dirname, 'node_modules/@gravity-ui/uikit');
const uiKitIconsRoot = path.resolve(__dirname, 'node_modules/@gravity-ui/icons');

module.exports = {
    webpack: (config, env) => {
        const oneOfRule = config.module.rules.find((r) => r.oneOf);
        oneOfRule.oneOf.splice(0, 0, {
            test: /\.svg$/,
            include: [
                path.resolve(srcRoot, 'assets/icons'),
                path.resolve(uiKitRoot, 'assets/icons'),
                uiKitIconsRoot,
            ],
            loader: '@svgr/webpack',
            options: {dimensions: false},
        });

        if (env === 'production') {
            config.output.path = path.resolve(__dirname, 'build/');
        }

        return config;
    },
    jest: (config) => {
        // Some @gravity-ui libs (react-data-table, paranoid) are build in esm only
        // So they need to be transformed
        // By default jest does not transform anything in node_modules
        // So this override excludes node_modules except @gravity-ui
        // see https://github.com/timarney/react-app-rewired/issues/241
        config.transformIgnorePatterns = ['node_modules/(?!(@gravity-ui)/)'];

        return config;
    },
};
