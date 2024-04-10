import React from 'react';

import type {InfoViewerItem} from '..';
import {InfoViewer, formatObject} from '..';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import {formatCdcStreamItem, formatCommonItem} from '../formatters';

interface CDCStreamOverviewProps {
    data?: TEvDescribeSchemeResult;
}

export const CDCStreamOverview = ({data}: CDCStreamOverviewProps) => {
    if (!data) {
        return <div className="error">No CDC Stream data</div>;
    }

    const TableIndex = data.PathDescription?.CdcStreamDescription;
    const info: Array<InfoViewerItem> = [];

    info.push(formatCommonItem('PathType', data.PathDescription?.Self?.PathType));
    info.push(formatCommonItem('CreateStep', data.PathDescription?.Self?.CreateStep));

    const {Mode, Format} = TableIndex || {};
    info.push(...formatObject(formatCdcStreamItem, {Mode, Format}));

    return (
        <React.Fragment>
            {info.length ? <InfoViewer info={info}></InfoViewer> : 'Empty'}
        </React.Fragment>
    );
};
