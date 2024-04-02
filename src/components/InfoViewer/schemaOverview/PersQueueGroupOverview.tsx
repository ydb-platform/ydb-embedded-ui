import React from 'react';

import type {InfoViewerItem} from '..';
import {InfoViewer} from '..';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import {formatCommonItem, formatPQGroupItem} from '../formatters';

interface PersQueueGroupOverviewProps {
    data?: TEvDescribeSchemeResult;
}

export const PersQueueGroupOverview = ({data}: PersQueueGroupOverviewProps) => {
    if (!data) {
        return <div className="error">No PersQueueGroup data</div>;
    }

    const pqGroup = data.PathDescription?.PersQueueGroup;
    const info: Array<InfoViewerItem> = [];

    info.push(formatCommonItem('PathType', data.PathDescription?.Self?.PathType));
    info.push(formatCommonItem('CreateStep', data.PathDescription?.Self?.CreateStep));

    //@ts-expect-error
    info.push(formatPQGroupItem('Partitions', pqGroup?.Partitions || []));
    info.push(
        //@ts-expect-error
        formatPQGroupItem(
            'PQTabletConfig',
            pqGroup?.PQTabletConfig || {PartitionConfig: {LifetimeSeconds: 0}},
        ),
    );

    return (
        <React.Fragment>
            {info.length ? <InfoViewer info={info}></InfoViewer> : 'Empty'}
        </React.Fragment>
    );
};
