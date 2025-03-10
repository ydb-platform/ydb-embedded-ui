import React from 'react';

import type {KeyValueRow} from '../../types/api/query';
import type {ResizeableDataTableProps} from '../ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';

import {shardsColumnIdToGetColumn} from './columns';
import type {TopShardsColumnId} from './constants';
import {TOP_SHARDS_COLUMNS_WIDTH_LS_KEY, isSortableTopShardsColumn} from './constants';

export interface ShardsTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'columnsWidthLSKey' | 'columns'> {
    columnsIds: TopShardsColumnId[];
    database: string;
    schemaPath?: string;
}

export function ShardsTable({columnsIds, schemaPath, database, ...props}: ShardsTableProps) {
    const columns = React.useMemo(
        () =>
            columnsIds
                .filter((id) => id in shardsColumnIdToGetColumn)
                .map((id) => {
                    const column = shardsColumnIdToGetColumn[id]({database, schemaPath});

                    return {
                        ...column,
                        sortable: isSortableTopShardsColumn(column.name),
                    };
                }),
        [columnsIds, database, schemaPath],
    );

    return (
        <ResizeableDataTable
            {...props}
            columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
            columns={columns}
        />
    );
}
