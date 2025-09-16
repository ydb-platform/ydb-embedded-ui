import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {valueIsDefined} from '../../utils';
import {useAutoRefreshInterval, useTypedSelector} from '../../utils/hooks';

import {TabletsTable} from './TabletsTable';

interface TabletsProps {
    path?: string;
    database?: string;
    databaseFullPath?: string;
    nodeId?: string | number;
    /**
     * Show/hide dead tablets: shown in pages needing complete statistics,
     * hidden in pages that already display multiple tablet generations to reduce visual noise.
     */
    onlyActive?: boolean;
    scrollContainerRef: React.RefObject<HTMLElement>;
}

export function Tablets({
    nodeId,
    path,
    database,
    databaseFullPath,
    onlyActive,
    scrollContainerRef,
}: TabletsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    let params: TabletsApiRequestParams = {};
    const filter = onlyActive
        ? `(State=[Created,ResolveStateStorage,Candidate,BlockBlobStorage,RebuildGraph,WriteZeroEntry,Restored,Discover,Lock,Active,ResolveLeader,Terminating])`
        : undefined;

    const schemaPathParam = React.useMemo(() => {
        if (!isNil(path) && !isNil(databaseFullPath)) {
            return {path, databaseFullPath};
        }
        return undefined;
    }, [path, databaseFullPath]);

    if (valueIsDefined(nodeId)) {
        params = {nodeId, database, filter};
    } else if (schemaPathParam) {
        params = {path: schemaPathParam, database, filter};
    }
    const {isLoading, error} = tabletsApi.useGetTabletsInfoQuery(
        Object.keys(params).length === 0 ? skipToken : params,
        {
            pollingInterval: autoRefreshInterval,
        },
    );

    const tablets = useTypedSelector((state) => selectTabletsWithFqdn(state, params));

    return (
        <TabletsTable
            scrollContainerRef={scrollContainerRef}
            tablets={tablets}
            database={database}
            loading={isLoading}
            error={error}
            nodeId={nodeId}
        />
    );
}
