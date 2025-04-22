import React from 'react';

import type {KeyValueRow} from '../../types/api/query';
import type {ResizeableDataTableProps} from '../ResizeableDataTable/ResizeableDataTable';
import {ResizeableDataTable} from '../ResizeableDataTable/ResizeableDataTable';

import {shardsColumnIdToGetColumn} from './columns';
import type {TopShardsColumnId} from './constants';
import {TOP_SHARDS_COLUMNS_WIDTH_LS_KEY, isSortableTopShardsColumn} from './constants';
import type {ShardsColumn} from './types';

export interface ShardsTableProps
    extends Omit<ResizeableDataTableProps<KeyValueRow>, 'columnsWidthLSKey' | 'columns'> {
    columnsIds: TopShardsColumnId[];
    database: string;
    columns?: ShardsColumn[];
    schemaPath?: string;
}

export function ShardsTable({
    columnsIds,
    schemaPath,
    database,
    columns: propsColumns,
    ...props
}: ShardsTableProps) {
    const columns = React.useMemo(() => {
        if (propsColumns) {
            return propsColumns;
        }

        return columnsIds
            .filter((id) => id in shardsColumnIdToGetColumn)
            .map((id) => {
                const column = shardsColumnIdToGetColumn[id]({database, schemaPath});

                return {
                    ...column,
                    sortable: isSortableTopShardsColumn(column.name),
                };
            });
    }, [columnsIds, database, propsColumns, schemaPath]);

    return (
        <ResizeableDataTable
            {...props}
            columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
            columns={columns}
        />
    );
}
