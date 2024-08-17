import React from 'react';

import {Table, useTable} from '@gravity-ui/table';
import type {CellContext, ColumnDef, ExpandedState} from '@tanstack/react-table';

import type {SimplifiedPlanItem} from '../../../../../../store/reducers/explainQuery/types';
import {configuredNumeral} from '../../../../../../utils/numeral';
import {formatToMs} from '../../../../../../utils/timeParsers';
import {toExponential} from '../../../../../../utils/utils';

import {MetricsCell} from './MetricsCell';
import {OperationCell} from './OperationCell';
import type {ExtendedSimplifiesPlanItem} from './types';
import {block, getExtendedTreeNodes} from './utils';

import './SimplifiedPlan.scss';

function nameAccessorFn(row: ExtendedSimplifiesPlanItem) {
    return {name: row.name, operationParams: row.operationParams, lines: row.lines};
}

function metricsCell(info: CellContext<ExtendedSimplifiesPlanItem, unknown>) {
    const formatter = (value: number) =>
        value < 1e8 ? configuredNumeral(value).format() : toExponential(value, 1);

    return <MetricsCell value={info.getValue()} formatter={formatter} />;
}
function cpuCell(info: CellContext<ExtendedSimplifiesPlanItem, unknown>) {
    const formatter = (value: number) => formatToMs(Math.round(value));
    return <MetricsCell value={info.getValue()} formatter={formatter} />;
}

interface ColumnHeaderProps {
    name: string;
}

function ColumnHeader({name}: ColumnHeaderProps) {
    return <div className={block('table-header-content')}>{name}</div>;
}

const columns: ColumnDef<ExtendedSimplifiesPlanItem>[] = [
    {
        accessorKey: 'name',
        accessorFn: nameAccessorFn,
        header: () => <ColumnHeader name="Operation" />,
        size: 600,
        cell: (info) => (
            <OperationCell
                row={info.row}
                depth={info.row.depth}
                params={info.getValue<ReturnType<typeof nameAccessorFn>>()}
            />
        ),
    },
    {
        accessorKey: 'aCpu',
        header: () => <ColumnHeader name="A-Cpu" />,
        size: 90,
        minSize: 100,
        cell: cpuCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'aRows',
        header: () => <ColumnHeader name="A-Rows" />,
        size: 90,
        minSize: 100,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'eCost',
        header: () => <ColumnHeader name="E-Cost" />,
        size: 90,
        minSize: 100,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'eRows',
        header: () => <ColumnHeader name="E-Rows" />,
        size: 90,
        minSize: 100,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'eSize',
        header: () => <ColumnHeader name="E-Size" />,
        size: 90,
        minSize: 100,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
];

interface SimplifiedPlanProps {
    plan: SimplifiedPlanItem[];
}

export function SimplifiedPlan({plan}: SimplifiedPlanProps) {
    const planWithLinesInfo = React.useMemo(() => getExtendedTreeNodes(plan), [plan]);
    const [expanded, setExpanded] = React.useState<ExpandedState>(true);

    const table = useTable({
        columns,
        data: planWithLinesInfo,
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
                headerCellClassName={({column}) => {
                    const align = column.columnDef.meta?.align;
                    return block('table-header-cell', {align});
                }}
                cellClassName={(cell) => {
                    const align = cell?.column.columnDef.meta?.align;
                    const verticalAlign = cell?.column.columnDef.meta?.verticalAlign;
                    return block('table-cell', {align, 'vertical-align': verticalAlign});
                }}
                className={block('table')}
                stickyHeader
            />
        </div>
    );
}
