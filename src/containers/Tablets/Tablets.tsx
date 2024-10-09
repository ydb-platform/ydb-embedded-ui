import {skipToken} from '@reduxjs/toolkit/query';

import {ResponseError} from '../../components/Errors/ResponseError';
import {TableSkeleton} from '../../components/TableSkeleton/TableSkeleton';
import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval, useTypedSelector} from '../../utils/hooks';

import {TabletsTable} from './TabletsTable';

const b = cn('tablets');

interface TabletsProps {
    path?: string;
    database?: string;
    nodeId?: string | number;
    className?: string;
}

export function Tablets({nodeId, path, database, className}: TabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    let params: TabletsApiRequestParams = {};
    const node = nodeId === undefined ? undefined : String(nodeId);
    if (node !== undefined) {
        params = {nodeId: node, database};
    } else if (path) {
        params = {path, database};
    }
    const {currentData, isFetching, error} = tabletsApi.useGetTabletsInfoQuery(
        Object.keys(params).length === 0 ? skipToken : params,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const loading = isFetching && currentData === undefined;
    const tablets = useTypedSelector((state) => selectTabletsWithFqdn(state, params));

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <div className={b(null, className)}>
            {error ? <ResponseError error={error} /> : null}
            {currentData ? <TabletsTable tablets={tablets} database={database} /> : null}
        </div>
    );
}
