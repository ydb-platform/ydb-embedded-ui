import {
    builtinFunctions,
    keywords,
    typeKeywords,
} from 'monaco-yql-languages/build/yql/yql.keywords';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function yql(Prism: any) {
    // Define YQL language
    // eslint-disable-next-line no-param-reassign
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
