import React from 'react';

import {cn} from '../../utils/cn';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';

import './FixedHeightQuery.scss';

const b = cn('ydb-fixed-height-query');

const FIXED_PADDING = 8;
const LINE_HEIGHT = 20;

interface FixedHeightQueryProps {
    value?: string;
    lines?: number;
    hasClipboardButton?: boolean;
    clipboardButtonAlwaysVisible?: boolean;
}

export const FixedHeightQuery = ({
    value = '',
    lines = 4,
    hasClipboardButton,
    clipboardButtonAlwaysVisible,
}: FixedHeightQueryProps) => {
    const heightValue = `${lines * LINE_HEIGHT + FIXED_PADDING}px`;

    // Remove empty lines from the beginning (lines with only whitespace are considered empty)
    const trimmedValue = value.replace(/^(\s*\n)+/, '');

    return (
        <div
            className={b()}
            style={
                {
                    height: heightValue,
                    '--line-clamp': lines,
                } as React.CSSProperties & {'--line-clamp': number}
            }
        >
            <YDBSyntaxHighlighter
                language="yql"
                text={trimmedValue}
                withClipboardButton={
                    hasClipboardButton
                        ? {
                              alwaysVisible: clipboardButtonAlwaysVisible,
                              copyText: value,
                              withLabel: false,
                          }
                        : false
                }
            />
        </div>
    );
};
