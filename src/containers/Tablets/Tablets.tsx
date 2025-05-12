import {skipToken} from '@reduxjs/toolkit/query';

import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {valueIsDefined} from '../../utils';
import {useAutoRefreshInterval, useTypedSelector} from '../../utils/hooks';

import {TabletsTable} from './TabletsTable';

interface TabletsProps {
    path?: string;
    database?: string;
    nodeId?: string | number;
    /**
     * Show/hide dead tablets: shown in pages needing complete statistics,
     * hidden in pages that already display multiple tablet generations to reduce visual noise.
     */
    onlyActive?: boolean;
}

export function Tablets({nodeId, path, database, onlyActive}: TabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    let params: TabletsApiRequestParams = {};
    const filter = onlyActive ? `(State!=Dead)` : undefined;

    if (valueIsDefined(nodeId)) {
        params = {nodeId, database, filter};
    } else if (path) {
        params = {path, database, filter};
    }
    const {isLoading, error} = tabletsApi.useGetTabletsInfoQuery(
        Object.keys(params).length === 0 ? skipToken : params,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const tablets = useTypedSelector((state) => selectTabletsWithFqdn(state, params));

    return <TabletsTable tablets={tablets} database={database} loading={isLoading} error={error} />;
}
