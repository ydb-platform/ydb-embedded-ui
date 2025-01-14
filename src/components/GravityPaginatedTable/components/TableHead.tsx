import React from 'react';

import type {Table as TableInstance} from '@gravity-ui/table/tanstack';
import {flexRender} from '@tanstack/react-table';

import {b} from '../shared';
interface TableHeadProps<T> {
    rowHeight: number;
    table: TableInstance<T>;
}

export function TableHead<T>({rowHeight, table}: TableHeadProps<T>) {
    const headerGroups = table.getHeaderGroups();

    return (
        <React.Fragment>
            <colgroup>
                {table.getAllColumns().map((column) => {
                    return <col key={column.id} style={{width: column.getSize()}} />;
                })}
            </colgroup>
            <thead className={b('head')}>
                {headerGroups.map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return (
                                <th
                                    key={header.id}
                                    className={b('head-cell-wrapper')}
                                    style={{height: `${rowHeight}px`}}
                                >
                                    <div className={b('head-cell')}>
                                        <div className={b('head-cell-content')}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext(),
                                                  )}
                                        </div>
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                ))}
            </thead>
        </React.Fragment>
    );
}
