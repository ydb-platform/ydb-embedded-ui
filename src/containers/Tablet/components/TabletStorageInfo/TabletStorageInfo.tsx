import React from 'react';

import {Table, useTable} from '@gravity-ui/table';
import type {ExpandedState} from '@tanstack/react-table';

import type {TTabletHiveResponse} from '../../../../types/api/tablet';

import {getColumns} from './columns';
import {b} from './shared';
import {prepareData} from './utils';

import './TabletStorageInfo.scss';

interface TabletStorageInfoProps {
    data?: TTabletHiveResponse | null;
}

export function TabletStorageInfo({data}: TabletStorageInfoProps) {
    const [expanded, setExpanded] = React.useState<ExpandedState>({});
    const tree = React.useMemo(() => prepareData(data), [data]);
    const isExpandable = React.useMemo(() => tree.some((item) => item.children?.length), [tree]);
    const columns = React.useMemo(() => getColumns(isExpandable), [isExpandable]);
    const table = useTable({
        columns,
        data: tree,
        getSubRows: (item) => item.children,
        enableExpanding: true,
        onExpandedChange: setExpanded,
        state: {
            expanded,
        },
    });
    return (
        //block wrapper for table
        <div>
            <Table
                table={table}
                headerCellClassName={({column}) => {
                    const align = column.columnDef.meta?.align;
                    return b('table-header-cell', {align});
                }}
                cellClassName={(cell) => {
                    const align = cell?.column.columnDef.meta?.align;
                    const verticalAlign = cell?.column.columnDef.meta?.verticalAlign;
                    return b('table-cell', {align, 'vertical-align': verticalAlign});
                }}
                className={b('table')}
            />
        </div>
    );
}
