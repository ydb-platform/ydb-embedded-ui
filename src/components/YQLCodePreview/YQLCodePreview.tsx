import React from 'react';

import {cn} from '../../utils/cn';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';

import './YQLCodePreview.scss';

const b = cn('ydb-yql-code-preview');

interface YQLCodePreviewProps {
    text: string;
    title: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function YQLCodePreview({text, title, actions, className}: YQLCodePreviewProps) {
    return (
        <div className={b(null, className)}>
            <div className={b('header')}>
                <div className={b('title')}>{title}</div>
                {actions}
            </div>
            <YDBSyntaxHighlighter
                language="yql"
                text={text}
                withClipboardButton={{alwaysVisible: true, withLabel: false, size: 'm'}}
            />
        </div>
    );
}
