import React from 'react';

import {cn} from '../../utils/cn';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';

import './FixedHeightQuery.scss';

const b = cn('ydb-fixed-height-query');

const FIXED_PADDING = 0;
const LINE_HEIGHT = 20;

type FixedHeightQueryMode = 'fixed' | 'max';

interface FixedHeightQueryProps {
    value?: string;
    lines?: number;
    hasClipboardButton?: boolean;
    clipboardButtonAlwaysVisible?: boolean;
    mode?: FixedHeightQueryMode;
}

export const FixedHeightQuery = ({
    value = '',
    lines = 4,
    hasClipboardButton,
    clipboardButtonAlwaysVisible,
    mode = 'fixed',
}: FixedHeightQueryProps) => {
    const heightValue = `${lines * LINE_HEIGHT + FIXED_PADDING}px`;

    const valueToDisplay = React.useMemo(() => {
        // Remove empty lines from the beginning (lines with only whitespace are considered empty)
        const trimmedValue = value.replace(/^(\s*\n)+/, '');

        if (!trimmedValue) {
            return '';
        }

        let newLineCount = 0;
        let searchFromIndex = 0;

        while (newLineCount < lines) {
            const nextNewlineIndex = trimmedValue.indexOf('\n', searchFromIndex);
            if (nextNewlineIndex === -1) {
                // Fewer than `lines` newlines; return the whole string
                return trimmedValue;
            }
            newLineCount += 1;
            if (newLineCount === lines) {
                // Return everything up to (but not including) the Nth newline
                return trimmedValue.slice(0, nextNewlineIndex);
            }
            searchFromIndex = nextNewlineIndex + 1;
        }
        return trimmedValue;
    }, [value, lines]);

    const heightStyle = mode === 'fixed' ? {height: heightValue} : {maxHeight: heightValue};

    return (
        <div
            className={b()}
            style={
                {
                    ...heightStyle,
                    '--line-clamp': lines,
                } as React.CSSProperties & {'--line-clamp': number}
            }
        >
            <YDBSyntaxHighlighter
                language="yql"
                text={valueToDisplay}
                withClipboardButton={
                    hasClipboardButton
                        ? {
                              alwaysVisible: clipboardButtonAlwaysVisible,
                              copyText: value,
                              withLabel: false,
                              size: 'xs',
                          }
                        : undefined
                }
            />
        </div>
    );
};
