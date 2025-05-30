import React from 'react';

import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';
import type {TableProps} from '../TableWithControlsLayout/TableWithControlsLayout';

import {PaginatedTableProvider, usePaginatedTableState} from './PaginatedTableContext';
import type {PaginatedTableState} from './types';

export interface PaginatedTableWithLayoutProps {
    controls?: React.ReactNode;
    table: React.ReactNode;
    tableProps?: TableProps;
    error?: React.ReactNode;
    initialState?: Partial<PaginatedTableState>;
    fullHeight?: boolean;
    noBatching?: boolean;
}

// Internal component that has access to the paginated table context
const TableWithAutoScrolling = ({
    table,
    tableProps,
}: {
    table: React.ReactNode;
    tableProps?: TableProps;
}) => {
    const {tableState} = usePaginatedTableState();
    const {sortParams} = tableState;

    // Enhance tableProps to include sortParams in scrollDependencies
    const enhancedTableProps = React.useMemo(
        () => ({
            ...tableProps,
            scrollDependencies: [...(tableProps?.scrollDependencies || []), sortParams],
        }),
        [tableProps, sortParams],
    );

    return (
        <TableWithControlsLayout.Table {...enhancedTableProps}>
            {table}
        </TableWithControlsLayout.Table>
    );
};

export const PaginatedTableWithLayout = ({
    controls,
    table,
    tableProps,
    error,
    initialState,
    noBatching,
    fullHeight = true,
}: PaginatedTableWithLayoutProps) => (
    <PaginatedTableProvider initialState={initialState} noBatching={noBatching}>
        <TableWithControlsLayout fullHeight={fullHeight}>
            {controls ? (
                <TableWithControlsLayout.Controls>{controls}</TableWithControlsLayout.Controls>
            ) : null}
            {error}
            <TableWithAutoScrolling table={table} tableProps={tableProps} />
        </TableWithControlsLayout>
    </PaginatedTableProvider>
);
