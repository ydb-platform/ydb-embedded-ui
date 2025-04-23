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
    overrideColumns?: ShardsColumn[];
    schemaPath?: string;
}

export function ShardsTable({
    columnsIds,
    schemaPath,
    database,
    overrideColumns = [],
    ...props
}: ShardsTableProps) {
    const columns = React.useMemo(() => {
        return columnsIds
            .filter((id) => id in shardsColumnIdToGetColumn)
            .map((id) => {
                const overridedColumn = overrideColumns.find((column) => column.name === id);
                if (overridedColumn) {
                    return overridedColumn;
                }

                const column = shardsColumnIdToGetColumn[id]({database, schemaPath});

                return {
                    ...column,
                    sortable: isSortableTopShardsColumn(column.name),
                };
            });
    }, [columnsIds, database, overrideColumns, schemaPath]);

    return (
        <ResizeableDataTable
            {...props}
            columnsWidthLSKey={TOP_SHARDS_COLUMNS_WIDTH_LS_KEY}
            columns={columns}
        />
    );
}
