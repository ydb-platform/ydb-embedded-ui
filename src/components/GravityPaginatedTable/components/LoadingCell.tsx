import React from 'react';

import {Skeleton} from '@gravity-ui/uikit';

import {b} from '../shared';

interface LoadingCellProps {
    height: number;
}

export function LoadingCell({height}: LoadingCellProps): React.ReactElement {
    return (
        <div className={b('loading-cell')} style={{height: `${height}px`}}>
            <Skeleton className={b('row-skeleton')} />
        </div>
    );
}
