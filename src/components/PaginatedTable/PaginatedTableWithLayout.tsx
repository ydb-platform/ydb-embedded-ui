import React from 'react';

import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';
import type {TableWrapperProps} from '../TableWithControlsLayout/TableWithControlsLayout';

import {PaginatedTableProvider, usePaginatedTableState} from './PaginatedTableContext';
import type {PaginatedTableState} from './types';

export interface PaginatedTableWithLayoutProps {
    controls?: React.ReactNode;
    table: React.ReactNode;
    tableWrapperProps?: TableWrapperProps;
    error?: React.ReactNode;
    initialState?: Partial<PaginatedTableState>;
    fullHeight?: boolean;
    noBatching?: boolean;
}

const TableWrapper = ({
    table,
    tableWrapperProps,
}: {
    table: React.ReactNode;
    tableWrapperProps?: TableWrapperProps;
}) => {
    const {tableState} = usePaginatedTableState();
    const {sortParams} = tableState;

    const enhancedTableWrapperProps = React.useMemo(() => {
        const existingScrollDependencies = tableWrapperProps?.scrollDependencies || [];

        return {
            ...tableWrapperProps,
            scrollDependencies: [...existingScrollDependencies, sortParams],
        };
    }, [tableWrapperProps, sortParams]);

    return (
        <TableWithControlsLayout.Table {...enhancedTableWrapperProps}>
            {table}
        </TableWithControlsLayout.Table>
    );
};

const ControlsSection = ({controls}: {controls?: React.ReactNode}) => {
    if (!controls) {
        return null;
    }

    return <TableWithControlsLayout.Controls>{controls}</TableWithControlsLayout.Controls>;
};

const ErrorSection = ({error}: {error?: React.ReactNode}) => {
    if (!error) {
        return null;
    }

    return <React.Fragment>{error}</React.Fragment>;
};

export const PaginatedTableWithLayout = ({
    controls,
    table,
    tableWrapperProps,
    error,
    initialState,
    noBatching,
    fullHeight = true,
}: PaginatedTableWithLayoutProps) => {
    return (
        <PaginatedTableProvider initialState={initialState} noBatching={noBatching}>
            <TableWithControlsLayout fullHeight={fullHeight}>
                <ControlsSection controls={controls} />
                <ErrorSection error={error} />
                <TableWrapper table={table} tableWrapperProps={tableWrapperProps} />
            </TableWithControlsLayout>
        </PaginatedTableProvider>
    );
};
