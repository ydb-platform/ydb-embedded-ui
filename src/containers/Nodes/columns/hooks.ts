import React from 'react';

import {
    NODES_COLUMNS_TITLES,
    NODES_COLUMNS_TO_DATA_FIELDS,
} from '../../../components/nodesColumns/constants';
import type {GetNodesColumnsParams} from '../../../components/nodesColumns/types';
import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';
import {getRequiredDataFields} from '../../../utils/tableUtils/getRequiredDataFields';

import {getNodesColumns} from './columns';
import {
    DEFAULT_NODES_COLUMNS,
    NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    REQUIRED_NODES_COLUMNS,
} from './constants';

export function useNodesSelectedColumns(params: GetNodesColumnsParams) {
    const columns = React.useMemo(() => {
        return getNodesColumns(params);
    }, [params]);

    const {columnsToSelect, columnsToShow, setColumns} = useSelectedColumns(
        columns,
        NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
        NODES_COLUMNS_TITLES,
        DEFAULT_NODES_COLUMNS,
        REQUIRED_NODES_COLUMNS,
    );

    const dataFieldsRequired = React.useMemo(() => {
        return getRequiredDataFields(columnsToShow, NODES_COLUMNS_TO_DATA_FIELDS);
    }, [columnsToShow]);

    return {
        columnsToSelect,
        columnsToShow,
        setColumns,
        dataFieldsRequired,
    };
}
