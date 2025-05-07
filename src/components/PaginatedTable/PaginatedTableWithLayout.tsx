import React from 'react';

import {TableWithControlsLayout} from '../TableWithControlsLayout/TableWithControlsLayout';
import type {TableProps} from '../TableWithControlsLayout/TableWithControlsLayout';

import {PaginatedTableProvider} from './PaginatedTableContext';
import type {PaginatedTableState} from './types';

export interface PaginatedTableWithLayoutProps {
    controls: React.ReactNode;
    table: React.ReactNode;
    tableProps?: TableProps;
    error?: React.ReactNode;
    initialState?: Partial<PaginatedTableState>;
    fullHeight?: boolean;
}

export const PaginatedTableWithLayout = ({
    controls,
    table,
    tableProps,
    error,
    initialState,
    fullHeight = true,
}: PaginatedTableWithLayoutProps) => (
    <PaginatedTableProvider initialState={initialState}>
        <TableWithControlsLayout fullHeight={fullHeight}>
            <TableWithControlsLayout.Controls>{controls}</TableWithControlsLayout.Controls>
            {error}
            <TableWithControlsLayout.Table {...(tableProps || {})}>
                {table}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    </PaginatedTableProvider>
);
