import React from 'react';
import cn from 'bem-cn-lite';

import './TruncatedQuery.scss';

const b = cn('kv-truncated-query');

function TruncatedQuery({value, maxQueryHeight}) {
    const lines = value.split('\n');
    const truncated = lines.length > maxQueryHeight;

    if (truncated) {
        const content = lines.slice(0, maxQueryHeight).join('\n');
        const message =
            '\n...\nThe request was truncated. Click on the line to show the full query on the query tab';
        return (
            <React.Fragment>
                <span className={b()}>{content}</span>
                <span className={b('message', {color: 'secondary'})}>{message}</span>
            </React.Fragment>
        );
    }
    return value;
}

export default TruncatedQuery;
