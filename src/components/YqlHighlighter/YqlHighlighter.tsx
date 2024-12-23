import {useThemeValue} from '@gravity-ui/uikit';
import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';

import {cn} from '../../utils/cn';

import {dark, light, yql} from './yql';

import './YqlHighlighter.scss';

SyntaxHighlighter.registerLanguage('yql', yql);

const b = cn('yql-highlighter');

interface YqlHighlighterProps {
    children: string;
    className?: string;
}

export const YqlHighlighter = ({children, className}: YqlHighlighterProps) => {
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
