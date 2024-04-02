import React from 'react';

import type {InfoViewerItem} from '..';
import {InfoViewer} from '..';
import type {TCdcStreamDescription, TEvDescribeSchemeResult} from '../../../types/api/schema';
import {formatCdcStreamItem, formatCommonItem} from '../formatters';

const DISPLAYED_FIELDS: Set<keyof TCdcStreamDescription> = new Set(['Mode', 'Format']);

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

    let key: keyof TCdcStreamDescription;
    for (key in TableIndex) {
        if (DISPLAYED_FIELDS.has(key)) {
            //@ts-expect-error
            info.push(formatCdcStreamItem(key, TableIndex?.[key]));
        }
    }

    return (
        <React.Fragment>
            {info.length ? <InfoViewer info={info}></InfoViewer> : 'Empty'}
        </React.Fragment>
    );
};
