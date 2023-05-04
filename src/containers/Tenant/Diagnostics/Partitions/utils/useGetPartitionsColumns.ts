import {useEffect, useState} from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import type {PreparedPartitionDataWithHosts} from './types';
import {allColumns, generalColumns} from '../columns';
import {allPartitionsColumnsIds, generalPartitionColumnsIds} from './constants';

// Columns are different for partitions with consumers and without
export const useGetPartitionsColumns = (
    selectedConsumer: string | undefined,
): [Column<PreparedPartitionDataWithHosts>[], string[]] => {
    const [columns, setColumns] = useState<Column<PreparedPartitionDataWithHosts>[]>([]);
    const [columnsIdsForSelector, setColumnsIdsForSelector] = useState<string[]>([]);

    useEffect(() => {
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
