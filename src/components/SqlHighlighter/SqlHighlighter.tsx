import {useThemeValue} from '@gravity-ui/uikit';
import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import {oneLight, tomorrow} from 'react-syntax-highlighter/dist/esm/styles/prism';

import {cn} from '../../utils/cn';

import './SqlHighlighter.scss';

SyntaxHighlighter.registerLanguage('sql', sql);

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
            <SyntaxHighlighter language="sql" style={isDark ? tomorrow : oneLight}>
                {children}
            </SyntaxHighlighter>
        </div>
    );
};
