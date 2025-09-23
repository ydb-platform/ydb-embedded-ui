import React from 'react';

import {useSelectedColumns} from '../../../../../utils/hooks/useSelectedColumns';
import {allColumns, generalColumns} from '../columns';

import {
    PARTITIONS_COLUMNS_IDS,
    PARTITIONS_COLUMNS_TITLES,
    allPartitionsColumnsIds,
    generalPartitionColumnsIds,
} from './constants';

// Columns are different for partitions with consumers and without
export const useGetPartitionsColumns = (selectedConsumer: string | undefined) => {
    const {
        columnsToShow: allColumnsToShow,
        columnsToSelect: allColumnsToSelect,
        setColumns: setAllColumns,
    } = useSelectedColumns(
        allColumns,
        'partitionsSelectedColumns',
        PARTITIONS_COLUMNS_TITLES,
        allPartitionsColumnsIds,
        [PARTITIONS_COLUMNS_IDS.PARTITION_ID],
    );
    const {
        columnsToShow: generalColumnsToShow,
        columnsToSelect: generalColumnsToSelect,
        setColumns: setGeneralColumns,
    } = useSelectedColumns(
        generalColumns,
        'generalPartitionsSelectedColumns',
        PARTITIONS_COLUMNS_TITLES,
        generalPartitionColumnsIds,
        [PARTITIONS_COLUMNS_IDS.PARTITION_ID],
    );

    const columns = React.useMemo(() => {
        if (selectedConsumer) {
            return {
                columnsToShow: allColumnsToShow,
                columnsToSelect: allColumnsToSelect,
                setColumns: setAllColumns,
            };
        }

        return {
            columnsToShow: generalColumnsToShow,
            columnsToSelect: generalColumnsToSelect,
            setColumns: setGeneralColumns,
        };
    }, [
        allColumnsToSelect,
        allColumnsToShow,
        generalColumnsToSelect,
        generalColumnsToShow,
        selectedConsumer,
        setAllColumns,
        setGeneralColumns,
    ]);
    return columns;
};
