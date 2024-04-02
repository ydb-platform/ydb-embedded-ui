import * as monaco from 'monaco-editor';

import {LANGUAGE_S_EXPRESSION_ID} from './constants';

export function registerSExpressionLanguage() {
    monaco.languages.register({id: LANGUAGE_S_EXPRESSION_ID});
    monaco.languages.setMonarchTokensProvider(LANGUAGE_S_EXPRESSION_ID, {
        defaultToken: 'text',
        ignoreCase: true,
        tokenPostfix: '.yql',

        brackets: [
            {open: '[', close: ']', token: 'delimiter.square'},
            {open: '(', close: ')', token: 'delimiter.parenthesis'},
            {open: '{', close: '}', token: 'delimiter.curly'},
        ],

        keywordControl: 'bind|block|declare|export|import|lambda|let|quote|return'.split('|'),

        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        tokenizer: {
            root: [
                {include: '@whitespace'},
                {include: '@comment'},
                [/(#)((?:\w|[\\+-=<>'"&#])+)/, ['delimiter', 'constant']],
                [
                    /(?:\b(?:(defun|defmethod|defmacro))\b)(\s+)((?:\w|-|\?)*)/,
                    ['type.function', 'text', 'entity.name'],
                ],
                [/(\*)(\S*)(\*)/, ['delimiter', 'variable', 'delimiter']],
                {include: '@strings'},
                [/'[^#\s)(]+/, 'variable.parameter'],
                [/[(){}[\]]/, '@brackets'],
                // identifiers and keywords
                [
                    /(?:(?:<=?|>=?|==|!=|[-+*/%])|[a-zA-Z][a-zA-Z0-9!]*)/,
                    {
                        cases: {
                            '@keywordControl': {token: 'keyword.operator'},
                            '@default': 'identifier',
                        },
                    },
                ],
            ],
            whitespace: [[/\s+/, 'white']],
            comment: [[/#.*/, 'comment']],
            strings: [
                [/'?"(?=.)/, {token: 'string', next: '@qqstring'}],
                [/'?[@]{2}/, {token: 'string', next: '@multiline'}],
                [/'?x"(?:[0-9A-Fa-f]{2})*"/, 'string'],
            ],
            qqstring: [
                [/\\(?:[0-3][0-7][0-7]|x[0-9A-Fa-f]{2}|["tnrbfav\\])/, 'string.escape'],
                [/[^"\\]+/, 'string'],
                [/"|$/, {token: 'string', next: '@pop'}],
            ],
            multiline: [
                [/[^@]+/, 'string'],
                [/[@]{2}/, {token: 'string', next: '@pop'}],
                [/./, {token: 'string'}],
            ],
        },
    });
}
