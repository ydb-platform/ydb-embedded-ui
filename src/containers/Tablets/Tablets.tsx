import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {useAutoRefreshInterval, useTypedSelector} from '../../utils/hooks';

import {TabletsTable} from './TabletsTable';

interface TabletsProps {
    path?: string;
    database?: string;
    nodeId?: string | number;
}

export function Tablets({nodeId, path, database}: TabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    let params: TabletsApiRequestParams = {};
    if (!isNil(nodeId)) {
        params = {nodeId, database};
    } else if (path) {
        params = {path, database};
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
