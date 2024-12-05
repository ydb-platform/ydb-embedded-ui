import React from 'react';

import {useTable} from '@gravity-ui/table';
import type {ExpandedState} from '@tanstack/react-table';

import {Table} from '../../../../components/Table/Table';
import type {TTabletHiveResponse} from '../../../../types/api/tablet';

import {getColumns} from './columns';
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
        <div>
            <Table table={table} />
        </div>
    );
}
