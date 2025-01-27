import {ClipboardButton, useThemeValue} from '@gravity-ui/uikit';
import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism';

import {cn} from '../../../utils/cn';
import {dark, light} from '../../YqlHighlighter/yql';
import i18n from '../i18n';
import type {SnippetLanguage} from '../types';

import './ConnectToDBSyntaxHighlighter.scss';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('php', php);
SyntaxHighlighter.registerLanguage('python', python);

type ConnectToDBSyntaxHighlighterProps = {
    text: string;
    language: SnippetLanguage;
    className?: string;
};
const darkTheme: Record<string, React.CSSProperties> = {
    ...dark,
    'pre[class*="language-"]': {
        ...dark['pre[class*="language-"]'],
        background: vscDarkPlus['pre[class*="language-"]'].background,
        scrollbarColor: `var(--g-color-scroll-handle) transparent`,
    },
    'code[class*="language-"]': {
        ...dark['code[class*="language-"]'],
        whiteSpace: 'pre',
    },
};

const lightTheme: Record<string, React.CSSProperties> = {
    ...light,
    'pre[class*="language-"]': {
        ...light['pre[class*="language-"]'],
        background: 'var(--g-color-base-misc-light)',
        scrollbarColor: `var(--g-color-scroll-handle) transparent`,
    },
    'code[class*="language-"]': {
        ...light['code[class*="language-"]'],
        whiteSpace: 'pre',
    },
};

const b = cn('ydb-connect-to-db-syntax-highlighter');

export function ConnectToDBSyntaxHighlighter({text, language}: ConnectToDBSyntaxHighlighterProps) {
    const themeValue = useThemeValue();
    const isDark = themeValue === 'dark' || themeValue === 'dark-hc';

    return (
        <div className={b('wrapper')}>
            <div className={b('sticky-container')}>
                <ClipboardButton view="flat-secondary" size="s" className={b('copy')} text={text}>
                    {i18n('copy')}
                </ClipboardButton>
            </div>
            <SyntaxHighlighter
                language={language}
                style={isDark ? darkTheme : lightTheme}
                customStyle={{height: '100%'}}
            >
                {text}
            </SyntaxHighlighter>
        </div>
    );
}
