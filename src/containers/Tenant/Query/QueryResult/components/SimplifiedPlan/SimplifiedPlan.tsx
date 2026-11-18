import React from 'react';

import {useTable} from '@gravity-ui/table';
import {useResizeObserver} from '@gravity-ui/uikit';
import type {CellContext, ColumnDef, ExpandedState} from '@tanstack/react-table';

import {ColumnHeader, Table} from '../../../../../../components/Table/Table';
import type {SimplifiedPlanItem} from '../../../../../../store/reducers/query/types';
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

const columns: ColumnDef<ExtendedSimplifiesPlanItem>[] = [
    {
        accessorKey: 'name',
        accessorFn: nameAccessorFn,
        header: () => <ColumnHeader>Operation</ColumnHeader>,
        minSize: 240,
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
        header: () => <ColumnHeader>A-Cpu</ColumnHeader>,
        size: 89,
        minSize: 89,
        cell: cpuCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'aRows',
        header: () => <ColumnHeader>A-Rows</ColumnHeader>,
        size: 89,
        minSize: 89,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'eCost',
        header: () => <ColumnHeader>E-Cost</ColumnHeader>,
        size: 89,
        minSize: 89,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'eRows',
        header: () => <ColumnHeader>E-Rows</ColumnHeader>,
        size: 89,
        minSize: 89,
        cell: metricsCell,
        meta: {align: 'right', verticalAlign: 'top'},
    },
    {
        accessorKey: 'eSize',
        header: () => <ColumnHeader>E-Size</ColumnHeader>,
        size: 85,
        minSize: 85,
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
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [availableWidth, setAvailableWidth] = React.useState(0);
    const tableColumns = React.useMemo(() => {
        const metricsWidth = columns
            .slice(1)
            .reduce((width, column) => width + (column.size ?? 0), 0);
        return [
            {...columns[0], size: Math.max(240, availableWidth - metricsWidth)},
            ...columns.slice(1),
        ];
    }, [availableWidth]);

    const table = useTable({
        columns: tableColumns,
        data: planWithLinesInfo,
        getSubRows: (item) => item.children,
        enableExpanding: true,
        onExpandedChange: setExpanded,
        state: {expanded},
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
    });

    const measure = React.useCallback(() => {
        const element = containerRef.current;
        if (element && Object.keys(table.getState().columnSizing).length === 0) {
            const style = getComputedStyle(element);
            setAvailableWidth(
                element.clientWidth -
                    parseFloat(style.paddingLeft) -
                    parseFloat(style.paddingRight),
            );
        }
    }, [table]);
    React.useLayoutEffect(measure, [measure]);
    useResizeObserver({ref: containerRef, onResize: measure});

    return (
        <div className={block()} ref={containerRef}>
            <Table
                table={table}
                className={block('table')}
                stickyHeader
                attributes={{style: {width: table.getTotalSize()}}}
            />
        </div>
    );
}
