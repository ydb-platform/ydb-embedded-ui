import React from 'react';

import {TableHead} from './TableHead';
import {b} from './shared';
import type {Column, HandleTableColumnsResize, OnSort} from './types';

interface FixedTableHeaderProps<T> {
    columns: Column<T>[];
    onSort?: OnSort;
    onColumnsResize?: HandleTableColumnsResize;
}

/**
 * Fixed table header component that maintains proper table structure
 * while being synchronized with the virtualized body container
 */
export const FixedTableHeader = <T,>({
    columns,
    onSort,
    onColumnsResize,
}: FixedTableHeaderProps<T>) => {
    return (
        <div className={b('header-container')}>
            <table className={b('header-table')}>
                <TableHead columns={columns} onSort={onSort} onColumnsResize={onColumnsResize} />
            </table>
        </div>
    );
};
