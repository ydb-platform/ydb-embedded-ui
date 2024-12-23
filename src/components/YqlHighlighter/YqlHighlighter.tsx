import {useThemeValue} from '@gravity-ui/uikit';
import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';

import {dark, light, yql} from './yql';

SyntaxHighlighter.registerLanguage('yql', yql);

interface YqlHighlighterProps {
    children: string;
    className?: string;
}

export const YqlHighlighter = ({children, className}: YqlHighlighterProps) => {
    const themeValue = useThemeValue();
    const isDark = themeValue === 'dark' || themeValue === 'dark-hc';

    return (
        <div className={className}>
            <SyntaxHighlighter language="yql" style={isDark ? dark : light}>
                {children}
            </SyntaxHighlighter>
        </div>
    );
};
