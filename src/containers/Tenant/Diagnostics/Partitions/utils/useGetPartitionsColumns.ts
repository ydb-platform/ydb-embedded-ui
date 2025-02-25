import React from 'react';

import type {Column} from '@gravity-ui/react-data-table';

import {useDatabaseFromQuery} from '../../../../../utils/hooks/useDatabaseFromQuery';
import {getAllColumns, getGeneralColumns} from '../columns';

import {allPartitionsColumnsIds, generalPartitionColumnsIds} from './constants';
import type {PreparedPartitionDataWithHosts} from './types';

// Columns are different for partitions with consumers and without
export const useGetPartitionsColumns = (
    selectedConsumer?: string,
): [Column<PreparedPartitionDataWithHosts>[], string[]] => {
    const database = useDatabaseFromQuery();
    const [columns, setColumns] = React.useState<Column<PreparedPartitionDataWithHosts>[]>([]);
    const [columnsIdsForSelector, setColumnsIdsForSelector] = React.useState<string[]>([]);

    React.useEffect(() => {
        if (selectedConsumer) {
            setColumns(getAllColumns(database));
            setColumnsIdsForSelector(allPartitionsColumnsIds);
        } else {
            setColumns(getGeneralColumns(database));
            setColumnsIdsForSelector(generalPartitionColumnsIds);
        }
    }, [selectedConsumer, database]);

    return [columns, columnsIdsForSelector];
};
