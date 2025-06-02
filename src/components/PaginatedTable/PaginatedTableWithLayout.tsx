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

/**
 * Hook to enhance table wrapper props with sort-dependent scroll behavior
 */
const useTableWrapperPropsWithSortDependency = (
    tableWrapperProps?: TableWrapperProps,
): TableWrapperProps => {
    const {tableState} = usePaginatedTableState();
    const {sortParams} = tableState;

    return React.useMemo(() => {
        const existingScrollDependencies = tableWrapperProps?.scrollDependencies || [];

        return {
            ...tableWrapperProps,
            scrollDependencies: [...existingScrollDependencies, sortParams],
        };
    }, [tableWrapperProps, sortParams]);
};

/**
 * Internal component that wraps the table with sort-dependent scrolling behavior.
 * This component has access to the paginated table context and automatically
 * scrolls to top when sort parameters change.
 */
const TableWrapper = ({
    table,
    tableWrapperProps,
}: {
    table: React.ReactNode;
    tableWrapperProps?: TableWrapperProps;
}) => {
    const enhancedTableWrapperProps = useTableWrapperPropsWithSortDependency(tableWrapperProps);

    return (
        <TableWithControlsLayout.Table {...enhancedTableWrapperProps}>
            {table}
        </TableWithControlsLayout.Table>
    );
};

/**
 * Renders the controls section if controls are provided
 */
const ControlsSection = ({controls}: {controls?: React.ReactNode}) => {
    if (!controls) {
        return null;
    }

    return <TableWithControlsLayout.Controls>{controls}</TableWithControlsLayout.Controls>;
};

/**
 * Renders the error section if an error is provided
 */
const ErrorSection = ({error}: {error?: React.ReactNode}) => {
    if (!error) {
        return null;
    }

    return <React.Fragment>{error}</React.Fragment>;
};

/**
 * A complete table layout component that provides pagination context and
 * integrates with TableWithControlsLayout for consistent styling and behavior.
 *
 * Features:
 * - Provides pagination context to child components
 * - Automatic scroll-to-top on sort changes
 * - Optional controls and error display
 * - Configurable height behavior
 */
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
