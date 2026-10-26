import React from 'react';

import {useTable} from '@gravity-ui/table';
import {useResizeObserver} from '@gravity-ui/uikit';
import type {
    CellContext,
    ColumnDef,
    ColumnSizingState,
    ExpandedState,
    OnChangeFn,
} from '@tanstack/react-table';

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
        size: 400,
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
    columnSizing?: ColumnSizingState;
    onColumnSizingChange: (sizing: ColumnSizingState) => void;
}

export function SimplifiedPlan({plan, columnSizing, onColumnSizingChange}: SimplifiedPlanProps) {
    const planWithLinesInfo = React.useMemo(() => getExtendedTreeNodes(plan), [plan]);
    const [expanded, setExpanded] = React.useState<ExpandedState>(true);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [availableWidth, setAvailableWidth] = React.useState(0);
    const measure = React.useCallback(() => {
        const element = containerRef.current;
        if (element) {
            const style = getComputedStyle(element);
            setAvailableWidth(
                element.clientWidth -
                    parseFloat(style.paddingLeft) -
                    parseFloat(style.paddingRight),
            );
        }
    }, []);
    React.useLayoutEffect(measure, [measure]);
    useResizeObserver({ref: containerRef, onResize: measure});
    const metricsWidth = columns.slice(1).reduce((width, column) => width + (column.size ?? 0), 0);
    const sizing = columnSizing ?? {name: Math.max(240, availableWidth - metricsWidth)};
    const handleColumnSizingChange: OnChangeFn<ColumnSizingState> = (update) => {
        onColumnSizingChange(typeof update === 'function' ? update(sizing) : update);
    };

    const table = useTable({
        columns,
        data: planWithLinesInfo,
        getSubRows: (item) => item.children,
        enableExpanding: true,
        onExpandedChange: setExpanded,
        state: {
            expanded,
            columnSizing: sizing,
        },
        onColumnSizingChange: handleColumnSizingChange,
        enableColumnResizing: true,
        columnResizeMode: 'onChange',
    });

    return (
        <div className={block()} ref={containerRef}>
            <Table table={table} stickyHeader attributes={{style: {width: table.getTotalSize()}}} />
        </div>
    );
}
