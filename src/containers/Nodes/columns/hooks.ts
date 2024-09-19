import React from 'react';

import {useSelectedColumns} from '../../../utils/hooks/useSelectedColumns';

import {getNodesColumns} from './columns';
import {
    DEFAULT_NODES_COLUMNS,
    NODES_COLUMNS_TITLES,
    NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
    REQUIRED_NODES_COLUMNS,
} from './constants';
import type {GetNodesColumnsProps} from './types';

export function useNodesColumns(params: GetNodesColumnsProps) {
    return React.useMemo(() => {
        return getNodesColumns(params);
    }, [params]);
}

export function useNodesSelectedColumns(params: GetNodesColumnsProps) {
    const columns = useNodesColumns(params);

    return useSelectedColumns(
        columns,
        NODES_TABLE_SELECTED_COLUMNS_LS_KEY,
        NODES_COLUMNS_TITLES,
        DEFAULT_NODES_COLUMNS,
        REQUIRED_NODES_COLUMNS,
    );
}
