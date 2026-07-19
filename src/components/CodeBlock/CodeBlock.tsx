import React from 'react';

import {cn} from '../../utils/cn';
import type {YDBSyntaxHighlighterProps} from '../SyntaxHighlighter/YDBSyntaxHighlighter';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';

import './CodeBlock.scss';

const b = cn('ydb-code-block');

interface CodeBlockProps extends Omit<YDBSyntaxHighlighterProps, 'className'> {
    title: React.ReactNode;
    className?: string;
}

export function CodeBlock({title, className, ...syntaxHighlighterProps}: CodeBlockProps) {
    return (
        <div className={b(null, className)}>
            <div className={b('header')}>{title}</div>
            <YDBSyntaxHighlighter {...syntaxHighlighterProps} className={b('syntax-highlighter')} />
        </div>
    );
}
