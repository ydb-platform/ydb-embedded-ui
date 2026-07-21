import React from 'react';

import {cn} from '../../utils/cn';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';

import './QueryTextPreview.scss';

const b = cn('ydb-query-text-preview');

interface QueryTextPreviewProps {
    text: string;
    title: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function QueryTextPreview({text, title, actions, className}: QueryTextPreviewProps) {
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
