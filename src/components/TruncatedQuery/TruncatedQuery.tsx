import React from 'react';

import {cn} from '../../utils/cn';
import {YDBSyntaxHighlighter} from '../SyntaxHighlighter/YDBSyntaxHighlighter';

import './TruncatedQuery.scss';

const b = cn('kv-truncated-query');

interface TruncatedQueryProps {
    value?: string;
    maxQueryHeight?: number;
    hasClipboardButton?: boolean;
    clipboardButtonAlwaysVisible?: boolean;
}

export const TruncatedQuery = ({
    value = '',
    maxQueryHeight = 6,
    hasClipboardButton,
    clipboardButtonAlwaysVisible,
}: TruncatedQueryProps) => {
    const lines = value.split('\n');
    const truncated = lines.length > maxQueryHeight;

    if (truncated) {
        const content = lines.slice(0, maxQueryHeight).join('\n');
        const message =
            '\n...\nThe request was truncated. Click on the line to show the full query on the query tab';
        return (
            <React.Fragment>
                <YDBSyntaxHighlighter
                    language="yql"
                    className={b()}
                    text={content}
                    withClipboardButton={
                        hasClipboardButton
                            ? {
                                  alwaysVisible: clipboardButtonAlwaysVisible,
                                  copyText: value,
                                  withLabel: false,
                              }
                            : undefined
                    }
                />
                <span className={b('message', {color: 'secondary'})}>{message}</span>
            </React.Fragment>
        );
    }
    return (
        <YDBSyntaxHighlighter
            language="yql"
            className={b()}
            text={value}
            withClipboardButton={
                hasClipboardButton
                    ? {
                          alwaysVisible: clipboardButtonAlwaysVisible,
                          copyText: value,
                          withLabel: false,
                      }
                    : undefined
            }
        />
    );
};
