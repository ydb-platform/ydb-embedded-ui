import React from 'react';

import type {ColumnDef, Table as TableInstance} from '@gravity-ui/table/tanstack';
import type {VirtualItem} from '@gravity-ui/table/tanstack-virtual';

import {b as tableB} from '../../PaginatedTable/shared';
import type {BaseEntity, VirtualRow} from '../GravityPaginatedTable.types';

import {LoadingCell, TableCell} from './TableCell';

interface VirtualRowsProps<T extends BaseEntity> {
    virtualItems: VirtualItem[];
    virtualRows: VirtualRow<T>[];
    columns: ColumnDef<VirtualRow<T>>[];
    rowHeight: number;
    getRowClassName?: (row: T) => string | undefined;
    table: TableInstance<VirtualRow<T>>;
}

export function VirtualRows<T extends BaseEntity>({
    virtualItems,
    virtualRows,
    columns,
    rowHeight,
    getRowClassName,
    table,
}: VirtualRowsProps<T>): React.ReactElement {
    const {getRowModel} = table;
    const rows = getRowModel().rows;

    const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
    const totalHeight = rows.length * rowHeight;

    return (
        <React.Fragment>
            <tr style={{height: paddingTop}} />
            {virtualItems.map((virtualItem) => {
                const row = virtualRows[virtualItem.index];
                const tableRow = rows[virtualItem.index];

                let className = tableB('row');
                if (row.type === 'loading') {
                    className = tableB('row', {loading: true});
                } else if (row.type === 'empty') {
                    className = tableB('row', {empty: true});
                } else if (row.data && getRowClassName) {
                    const customClassName = getRowClassName(row.data);
                    if (customClassName) {
                        className = `${className} ${customClassName}`;
                    }
                }

                return (
                    <tr
                        key={row.id}
                        className={className}
                        data-index={virtualItem.index}
                        style={{
                            height: `${rowHeight}px`,
                        }}
                    >
                        {columns.map((column) => {
                            const resizeable = column.enableResizing ?? true;

                            if (row.type === 'loading') {
                                return (
                                    <LoadingCell
                                        key={column.id}
                                        height={rowHeight}
                                        width={column.size}
                                        resizeable={resizeable}
                                    />
                                );
                            }

                            if (row.type === 'data' && row.data && tableRow) {
                                const cell = tableRow
                                    .getAllCells()
                                    .find((c) => c.column.id === column.id);
                                if (!cell) {
                                    return null;
                                }

                                return (
                                    <TableCell
                                        key={column.id}
                                        height={rowHeight}
                                        width={column.size}
                                        resizeable={resizeable}
                                    >
                                        {typeof cell.column.columnDef.cell === 'function'
                                            ? cell.column.columnDef.cell({
                                                  row: tableRow,
                                                  getValue: () => cell.getValue(),
                                                  column: cell.column,
                                                  table,
                                                  renderValue: () => cell.getValue(),
                                                  cell,
                                              })
                                            : null}
                                    </TableCell>
                                );
                            }

                            return (
                                <TableCell
                                    key={column.id}
                                    height={rowHeight}
                                    width={column.size}
                                    resizeable={resizeable}
                                >
                                    {null}
                                </TableCell>
                            );
                        })}
                    </tr>
                );
            })}
            <tr
                style={{
                    height: Math.max(
                        0,
                        totalHeight - (paddingTop + virtualItems.length * rowHeight),
                    ),
                }}
            />
        </React.Fragment>
    );
}
