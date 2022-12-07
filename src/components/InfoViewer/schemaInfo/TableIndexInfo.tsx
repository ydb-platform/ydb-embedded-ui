import type {TEvDescribeSchemeResult, TIndexDescription} from '../../../types/api/schema';
import {getEntityName} from '../../../containers/Tenant/utils';

import {formatTableIndexItem} from '../formatters';
import {InfoViewer, InfoViewerItem} from '..';

const DISPLAYED_FIELDS: Set<keyof TIndexDescription> = new Set([
    'Type',
    'State',
    'DataSize',
    'KeyColumnNames',
    'DataColumnNames',
]);

interface TableIndexInfoProps {
    data?: TEvDescribeSchemeResult;
}

export const TableIndexInfo = ({data}: TableIndexInfoProps) => {
    const entityName = getEntityName(data?.PathDescription);

    if (!data) {
        return <div className="error">No {entityName} data</div>;
    }

    const TableIndex = data.PathDescription?.TableIndex;
    const info: Array<InfoViewerItem> = [];

    let key: keyof TIndexDescription;
    for (key in TableIndex) {
        if (DISPLAYED_FIELDS.has(key)) {
            info.push(formatTableIndexItem(key, TableIndex?.[key]));
        }
    }

    return <InfoViewer title={entityName} info={info} />;
};
