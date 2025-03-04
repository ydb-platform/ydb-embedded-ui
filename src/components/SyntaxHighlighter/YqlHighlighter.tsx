import {PrismLight as SyntaxHighlighter} from 'react-syntax-highlighter';

import {b} from './shared';
import {useSyntaxHighlighterStyle} from './themes';
import {yql} from './yql';

SyntaxHighlighter.registerLanguage('yql', yql);

interface YqlHighlighterProps {
    children: string;
    className?: string;
}

/** SyntaxHighlighter with just YQL for sync load */
export function YqlHighlighter({children, className}: YqlHighlighterProps) {
    const style = useSyntaxHighlighterStyle(true);

    return (
        <div className={b(null, className)}>
            <SyntaxHighlighter language="yql" style={style}>
                {children}
            </SyntaxHighlighter>
        </div>
    );
}
