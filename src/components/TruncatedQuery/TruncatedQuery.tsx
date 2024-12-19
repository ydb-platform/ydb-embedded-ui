import React from 'react';

import {cn} from '../../utils/cn';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
import {SqlHighlighter} from '../SqlHighlighter/SqlHighlighter';

import './TruncatedQuery.scss';

const b = cn('kv-truncated-query');

interface TruncatedQueryProps {
    value?: string;
    maxQueryHeight?: number;
}

export const TruncatedQuery = ({value = '', maxQueryHeight = 6}: TruncatedQueryProps) => {
    const lines = value.split('\n');
    const truncated = lines.length > maxQueryHeight;

    if (truncated) {
        const content = lines.slice(0, maxQueryHeight).join('\n');
        const message =
            '\n...\nThe request was truncated. Click on the line to show the full query on the query tab';
        return (
            <React.Fragment>
                <SqlHighlighter className={b()}>{content}</SqlHighlighter>
                <span className={b('message', {color: 'secondary'})}>{message}</span>
            </React.Fragment>
        );
    }
    return <SqlHighlighter>{value}</SqlHighlighter>;
};

interface OneLineQueryWithPopoverProps {
    value?: string;
}

export const OneLineQueryWithPopover = ({value = ''}: OneLineQueryWithPopoverProps) => {
    return (
        <CellWithPopover
            contentClassName={b('popover-content')}
            content={<SqlHighlighter>{value}</SqlHighlighter>}
        >
            <SqlHighlighter>{value}</SqlHighlighter>
        </CellWithPopover>
    );
};
