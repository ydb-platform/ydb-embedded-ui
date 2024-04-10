import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import {allColumns, generalColumns} from '../columns';

import {allPartitionsColumnsIds, generalPartitionColumnsIds} from './constants';
import type {PreparedPartitionDataWithHosts} from './types';

// Columns are different for partitions with consumers and without
export const useGetPartitionsColumns = (
    selectedConsumer: string | undefined,
): [Column<PreparedPartitionDataWithHosts>[], string[]] => {
    const [columns, setColumns] = React.useState<Column<PreparedPartitionDataWithHosts>[]>([]);
    const [columnsIdsForSelector, setColumnsIdsForSelector] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (selectedConsumer) {
            setColumns(allColumns);
            setColumnsIdsForSelector(allPartitionsColumnsIds);
        } else {
            setColumns(generalColumns);
            setColumnsIdsForSelector(generalPartitionColumnsIds);
        }
    }, [selectedConsumer]);

    return [columns, columnsIdsForSelector];
};
