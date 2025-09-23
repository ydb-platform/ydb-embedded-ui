import React from 'react';

import {allColumns, generalColumns} from '../columns';

// Columns are different for partitions with consumers and without
export const useGetPartitionsColumns = (selectedConsumer: string | undefined) => {
    const columns = React.useMemo(() => {
        if (selectedConsumer) {
            return allColumns;
        }

        return generalColumns;
    }, [selectedConsumer]);

    return columns;
};
