import React from 'react';

import type {KeyValueRow} from '../../types/api/query';
import type {ResizeableDataTableProps} from '../ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';

import {shardsColumnIdToGetColumn} from './columns';
import type {TopShardsColumnId} from './constants';
import {TOP_SHARDS_COLUMNS_WIDTH_LS_KEY, isSortableTopShardsColumn} from './constants';

interface ShardsTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'columnsWidthLSKey' | 'columns'> {
    columnsIds: TopShardsColumnId[];
    schemaPath?: string;
}

export function ShardsTable({columnsIds, schemaPath, ...props}: ShardsTableProps) {
    const columns = React.useMemo(
        () =>
            columnsIds
                .map((id) => {
                    return shardsColumnIdToGetColumn[id](schemaPath);
                })
                .map((column) => {
                    return {
                        ...column,
                        sortable: isSortableTopShardsColumn(column.name),
                    };
                }),
        [columnsIds, schemaPath],
    );

    return (
        <ResizeableDataTable
            {...props}
            columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
            columns={columns}
        />
    );
}
