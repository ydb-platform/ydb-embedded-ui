import {
    builtinFunctions,
    keywords,
    typeKeywords,
} from 'monaco-yql-languages/build/yql/yql.keywords';
import {
    vscDarkPlus as darkTheme,
    materialLight as lightTheme,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

export const light = {
    ...lightTheme,
    'pre[class*="language-"]': {
        ...lightTheme['pre[class*="language-"]'],
        background: 'transparent',
    },
    'code[class*="language-"]': {
        ...lightTheme['code[class*="language-"]'],
        background: 'transparent',
    },
    comment: {
        color: '#969896',
    },
    string: {
        color: '#a31515',
    },
    tablepath: {
        color: '#338186',
    },
    function: {
        color: '#7a3e9d',
    },
    udf: {
        color: '#7a3e9d',
    },
    type: {
        color: '#4d932d',
    },
    boolean: {
        color: '#608b4e',
    },
    constant: {
        color: '#608b4e',
    },
    variable: {
        color: '#001188',
    },
};

export const dark = {
    ...darkTheme,
    'pre[class*="language-"]': {
        ...darkTheme['pre[class*="language-"]'],
        background: 'transparent',
    },
    'code[class*="language-"]': {
        ...darkTheme['code[class*="language-"]'],
        background: 'transparent',
    },
    comment: {
        color: '#969896',
    },
    string: {
        color: '#ce9178',
    },
    tablepath: {
        color: '#338186',
    },
    function: {
        color: '#9e7bb0',
    },
    udf: {
        color: '#9e7bb0',
    },
    type: {
        color: '#6A8759',
    },
    boolean: {
        color: '#608b4e',
    },
    constant: {
        color: '#608b4e',
    },
    variable: {
        color: '#74b0df',
    },
};

export function yql(Prism: any) {
    // Define YQL language
    Prism.languages.yql = {
        comment: [
            {
                pattern: /--.*$/m,
                greedy: true,
            },
            {
                pattern: /\/\*[\s\S]*?(?:\*\/|$)/,
                greedy: true,
            },
        ],
        tablepath: {
            pattern: /(`[\w/]+`\s*\.\s*)?`[^`]+`/,
            greedy: true,
        },
        string: [
            {
                pattern: /'(?:\\[\s\S]|[^\\'])*'/,
                greedy: true,
            },
            {
                pattern: /"(?:\\[\s\S]|[^\\"])*"/,
                greedy: true,
            },
            {
                pattern: /@@(?:[^@]|@(?!@))*@@/,
                greedy: true,
            },
        ],
        variable: [
            {
                pattern: /\$[a-zA-Z_]\w*/,
                greedy: true,
            },
        ],
        function: {
            pattern: new RegExp(`\\b(?:${builtinFunctions.join('|')})\\b`, 'i'),
            greedy: true,
        },
        keyword: {
            pattern: new RegExp(`\\b(?:${keywords.join('|')})\\b`, 'i'),
            greedy: true,
        },
        udf: {
            pattern: /[A-Za-z_]\w*::[A-Za-z_]\w*/,
            greedy: true,
        },
        type: {
            pattern: new RegExp(`\\b(?:${typeKeywords.join('|')})\\b`, 'i'),
            greedy: true,
        },
        boolean: {
            pattern: /\b(?:true|false|null)\b/i,
            greedy: true,
        },
        number: {
            pattern: /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i,
            greedy: true,
        },
        operator: {
            pattern: /[-+*/%<>!=&|^~]+|\b(?:and|or|not|is|like|ilike|rlike|in|between)\b/i,
            greedy: true,
        },
        punctuation: {
            pattern: /[;[\](){}.,]/,
            greedy: true,
        },
    };
}

yql.displayName = 'yql';
yql.aliases = ['yql'] as string[];
