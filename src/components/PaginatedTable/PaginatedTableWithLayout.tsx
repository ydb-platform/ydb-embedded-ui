import React from 'react';

import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';
import type {TableWrapperProps} from '../TableWithControlsLayout/TableWithControlsLayout';

import {PaginatedTableProvider, usePaginatedTableState} from './PaginatedTableContext';
import type {PaginatedTableState} from './types';

export interface PaginatedTableWithLayoutProps {
    controls?: React.ReactNode;
    extraControls?: React.ReactNode;
    table: React.ReactNode;
    footer?: React.ReactNode;
    tableWrapperProps?: Omit<TableWrapperProps, 'children'>;
    error?: React.ReactNode;
    /** Shown between controls and the table, e.g. a warning about the data in the table */
    notice?: React.ReactNode;
    initialState?: Partial<PaginatedTableState>;
    fullHeight?: boolean;
    noBatching?: boolean;
    inheritKeyboardNavigation?: boolean;
}

const TableWrapper = ({
    table,
    tableWrapperProps,
}: {
    table: React.ReactNode;
    tableWrapperProps?: Omit<TableWrapperProps, 'children'>;
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

const ControlsSection = ({
    controls,
    extraControls,
}: {
    controls?: React.ReactNode;
    extraControls?: React.ReactNode;
}) => {
    if (!controls && !extraControls) {
        return null;
    }

    return (
        <TableWithControlsLayout.Controls renderExtraControls={() => extraControls}>
            {controls}
        </TableWithControlsLayout.Controls>
    );
};

const ErrorSection = ({error}: {error?: React.ReactNode}) => {
    if (!error) {
        return null;
    }

    return <React.Fragment>{error}</React.Fragment>;
};

const NoticeSection = ({notice}: {notice?: React.ReactNode}) => {
    if (!notice) {
        return null;
    }

    return <TableWithControlsLayout.Notice>{notice}</TableWithControlsLayout.Notice>;
};

const FooterSection = ({footer}: {footer?: React.ReactNode}) => {
    if (!footer) {
        return null;
    }

    return <TableWithControlsLayout.Footer>{footer}</TableWithControlsLayout.Footer>;
};

export const PaginatedTableWithLayout = ({
    controls,
    extraControls,
    table,
    footer,
    tableWrapperProps,
    error,
    notice,
    initialState,
    noBatching,
    fullHeight = true,
    inheritKeyboardNavigation = false,
}: PaginatedTableWithLayoutProps) => {
    return (
        <PaginatedTableProvider initialState={initialState} noBatching={noBatching}>
            <TableWithControlsLayout
                fullHeight={fullHeight}
                inheritKeyboardNavigation={inheritKeyboardNavigation}
            >
                <ControlsSection controls={controls} extraControls={extraControls} />
                <NoticeSection notice={notice} />
                <ErrorSection error={error} />
                <TableWrapper table={table} tableWrapperProps={tableWrapperProps} />
                <FooterSection footer={footer} />
            </TableWithControlsLayout>
        </PaginatedTableProvider>
    );
};
