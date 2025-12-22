import type {ThemeRegistration} from 'shiki';

/**
 * Custom light theme for YQL syntax highlighting
 * Colors match the Monaco VS-light theme
 * Uses only tokens defined in YQL.tmLanguage.json
 */
export const yqlLightTheme: ThemeRegistration = {
    name: 'yql-light',
    type: 'light',
    tokenColors: [
        // Comments
        {
            scope: ['comment.block'],
            settings: {
                foreground: '#969896',
                fontStyle: 'italic',
            },
        },
        // Strings
        {
            scope: ['string.quoted.double'],
            settings: {
                foreground: '#a31515',
            },
        },
        // Path to table (backticks and @identifiers)
        {
            scope: ['string.interpolated'],
            settings: {
                foreground: '#338186',
            },
        },
        // Functions (UDF and builtin)
        {
            scope: ['entity.name.function'],
            settings: {
                foreground: '#7a3e9d',
            },
        },
        // Data types
        {
            scope: ['entity.name.type'],
            settings: {
                foreground: '#4d932d',
            },
        },
        // Keywords
        {
            scope: ['keyword.control'],
            settings: {
                foreground: '#0000ff',
            },
        },
        // Numeric constants
        {
            scope: ['constant.numeric'],
            settings: {
                foreground: '#098658',
            },
        },
        // Pragmas, settings, hints
        {
            scope: ['support.constant'],
            settings: {
                foreground: '#7497c4',
            },
        },
        // Variables ($param)
        {
            scope: ['variable.parameter'],
            settings: {
                foreground: '#000000',
            },
        },
        // Identifiers
        {
            scope: ['variable.other'],
            settings: {
                foreground: '#000000',
            },
        },
    ],
};

/**
 * Custom dark theme for YQL syntax highlighting
 * Colors match the Monaco VS-dark theme
 * Uses only tokens defined in YQL.tmLanguage.json
 */
export const yqlDarkTheme: ThemeRegistration = {
    name: 'yql-dark',
    type: 'dark',
    colors: {
        'editor.foreground': '#d4d4d4',
        'editor.background': '#1e1e1e',
    },
    tokenColors: [
        // Comments
        {
            scope: ['comment.block'],
            settings: {
                foreground: '#969896',
                fontStyle: 'italic',
            },
        },
        // Strings
        {
            scope: ['string.quoted.double'],
            settings: {
                foreground: '#ce9178',
            },
        },
        // Path to table (backticks and @identifiers)
        {
            scope: ['string.interpolated'],
            settings: {
                foreground: '#338186',
            },
        },
        // Functions (UDF and builtin)
        {
            scope: ['entity.name.function'],
            settings: {
                foreground: '#9e7bb0',
            },
        },
        // Data types
        {
            scope: ['entity.name.type'],
            settings: {
                foreground: '#6A8759',
            },
        },
        // Keywords
        {
            scope: ['keyword.control'],
            settings: {
                foreground: '#569cd6',
            },
        },
        // Numeric constants
        {
            scope: ['constant.numeric'],
            settings: {
                foreground: '#b5cea8',
            },
        },
        // Pragmas, settings, hints
        {
            scope: ['support.constant'],
            settings: {
                foreground: '#7497c4',
            },
        },
        // Variables ($param)
        {
            scope: ['variable.parameter'],
            settings: {
                foreground: '#D4D4D4',
            },
        },
        // Identifiers
        {
            scope: ['variable.other'],
            settings: {
                foreground: '#D4D4D4',
            },
        },
    ],
};
