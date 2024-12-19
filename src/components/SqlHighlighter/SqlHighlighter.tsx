import {useThemeValue} from '@gravity-ui/uikit';
import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';
import plsql from 'react-syntax-highlighter/dist/esm/languages/prism/plsql';
import {
    vscDarkPlus as darkTheme,
    materialLight as lightTheme,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

// Create custom themes with transparent backgrounds
const light = {
    ...lightTheme,
    'pre[class*="language-"]': {
        ...lightTheme['pre[class*="language-"]'],
        background: 'transparent',
    },
    'code[class*="language-"]': {
        ...lightTheme['code[class*="language-"]'],
        background: 'transparent',
    },
};

const dark = {
    ...darkTheme,
    'pre[class*="language-"]': {
        ...darkTheme['pre[class*="language-"]'],
        background: 'transparent',
    },
    'code[class*="language-"]': {
        ...darkTheme['code[class*="language-"]'],
        background: 'transparent',
    },
};

import {cn} from '../../utils/cn';

import './SqlHighlighter.scss';

SyntaxHighlighter.registerLanguage('plsql', plsql);

const b = cn('sql-highlighter');

interface SqlHighlighterProps {
    children: string;
    className?: string;
}

export const SqlHighlighter = ({children, className}: SqlHighlighterProps) => {
    const themeValue = useThemeValue();
    const isDark = themeValue === 'dark' || themeValue === 'dark-hc';

    return (
        <div className={b(null, className)}>
            <SyntaxHighlighter language="sql" style={isDark ? dark : light}>
                {children}
            </SyntaxHighlighter>
        </div>
    );
};
