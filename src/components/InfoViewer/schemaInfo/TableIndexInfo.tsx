import type {TEvDescribeSchemeResult, TIndexDescription} from '../../../types/api/schema';

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
    if (!data) {
        return (
            <div className="error">no index data</div>
        );
    }

    const TableIndex = data.PathDescription?.TableIndex;
    const info: Array<InfoViewerItem> = [];

    let key: keyof TIndexDescription;
    for (key in TableIndex) {
        if (DISPLAYED_FIELDS.has(key)) {
            info.push(formatTableIndexItem(key, TableIndex?.[key]));
        }
    }

    return (
        <>
            {info.length ? (
                <InfoViewer info={info}></InfoViewer>
            ) : (
                <>Empty</>
            )}
        </>
    );
};
