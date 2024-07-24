import React from 'react';

import {Table, useTable} from '@gravity-ui/table';
import type {CellContext, ColumnDef, ExpandedState} from '@tanstack/react-table';

import type {SimplifiedPlanItem} from '../../../../../../store/reducers/explainQuery/types';

import {MetricsCell} from './MetricsCell';
import {OperationCell} from './OperationCell';
import {block} from './utils';

import './SimplifiedPlan.scss';

function getTreeNodesCoordinates(items?: SimplifiedPlanItem[], prefix = '') {
    const result: string[] = [];
    items?.forEach((item, index) => {
        let newPrefix = `${prefix}.${index}`;
        if (!prefix) {
            newPrefix = String(index);
        }
        result.push(newPrefix);
        const childrenCoords = getTreeNodesCoordinates(item.children, newPrefix);
        result.push(...childrenCoords);
    });
    return result;
}

function nameAccessorFn(row: SimplifiedPlanItem) {
    return {name: row.name, operationParams: row.operationParams};
}

function metricsCell(info: CellContext<SimplifiedPlanItem, unknown>) {
    return <MetricsCell value={info.getValue()} />;
}

const columns: ColumnDef<SimplifiedPlanItem>[] = [
    {
        accessorKey: 'name',
        accessorFn: nameAccessorFn,
        header: 'Operation',
        size: 400,
        cell: (info) => (
            <OperationCell
                row={info.row}
                depth={info.row.depth}
                params={info.getValue<ReturnType<typeof nameAccessorFn>>()}
            />
        ),
    },
    {accessorKey: 'aCpu', header: 'A-Cpu', size: 50, cell: metricsCell},
    {accessorKey: 'aRows', header: 'A-Rows', size: 50, cell: metricsCell},
    {accessorKey: 'eCost', header: 'E-Cost', size: 50, cell: metricsCell},
    {accessorKey: 'eRows', header: 'E-Rows', size: 50, cell: metricsCell},
    {accessorKey: 'eSize', header: 'E-Size', size: 50, cell: metricsCell},
];

interface SimplifiedPlanProps {
    plan: SimplifiedPlanItem[];
}

export function SimplifiedPlan({plan}: SimplifiedPlanProps) {
    const [expanded, setExpanded] = React.useState<ExpandedState>(() => {
        const coordinates = getTreeNodesCoordinates(plan);
        return Object.fromEntries(coordinates.map((id) => [id, true]));
    });

    const table = useTable({
        columns,
        data: plan,
        getSubRows: (item) => item.children,
        enableExpanding: true,
        onExpandedChange: setExpanded,
        state: {
            expanded,
        },
    });

    return (
        <div className={block()}>
            <Table
                table={table}
                headerCellClassName={block('table-header-cell')}
                cellClassName={block('table-cell')}
                headerCellContentClassName={block('table-header-content')}
                className={block('table')}
            />
        </div>
    );
}
