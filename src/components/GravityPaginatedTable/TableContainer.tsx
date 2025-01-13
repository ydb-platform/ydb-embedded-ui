import React from 'react';

import {cn} from '../../utils/cn';

import type {TableContainerProps} from './GravityPaginatedTable.types';

import './GravityPaginatedTable.scss';

const b = cn('ydb-gravity-paginated-table');

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
    ({height = '600px', className, children}, ref) => {
        return (
            <div
                ref={ref}
                className={b('table-container', className)}
                style={{
                    height,
                    overflow: 'auto',
                }}
            >
                {children}
            </div>
        );
    },
);

TableContainer.displayName = 'TableContainer';
