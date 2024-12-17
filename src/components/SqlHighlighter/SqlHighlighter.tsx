import {useThemeValue} from '@gravity-ui/uikit';
import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';

import {cn} from '../../utils/cn';

import {dark, light, yql} from './yql';

import './SqlHighlighter.scss';

SyntaxHighlighter.registerLanguage('yql', yql);

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
            <SyntaxHighlighter language="yql" style={isDark ? dark : light}>
                {children}
            </SyntaxHighlighter>
        </div>
    );
};
