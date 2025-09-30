import React from 'react';

import type {GetNodesColumnsParams, NodesColumn} from '../../../components/nodesColumns/types';

import {getNodesColumns} from './columns';

export function useGetNodesColumns({
    columns: externalColumns,
    database,
    viewContext,
    columnsSettings,
}: GetNodesColumnsParams & {columns?: NodesColumn[]}) {
    return React.useMemo(() => {
        let columns: NodesColumn[];

        if (externalColumns) {
            columns = externalColumns;
        } else {
            columns = getNodesColumns({database, viewContext, columnsSettings});
        }

        return columns;
    }, [externalColumns, database, viewContext, columnsSettings]);
}
