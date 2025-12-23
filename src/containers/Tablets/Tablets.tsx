import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {useClusterWithProxy} from '../../store/reducers/cluster/cluster';
import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import {ETabletState} from '../../types/api/tablet';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {valueIsDefined} from '../../utils';
import {useAutoRefreshInterval, useTypedSelector} from '../../utils/hooks';

import {TabletsTable} from './TabletsTable';

const activeStatuses: ETabletState[] = [
    ETabletState.Created,
    ETabletState.ResolveStateStorage,
    ETabletState.Candidate,
    ETabletState.BlockBlobStorage,
    ETabletState.RebuildGraph,
    ETabletState.WriteZeroEntry,
    ETabletState.Restored,
    ETabletState.Discover,
    ETabletState.Lock,
    ETabletState.Active,
    ETabletState.ResolveLeader,
    ETabletState.Terminating,
];

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
    const useMetaProxy = useClusterWithProxy();

    let params: TabletsApiRequestParams = {};
    const filter = onlyActive ? `(State=[${activeStatuses.join(',')}])` : undefined;

    const schemaPathParam = React.useMemo(() => {
        if (!isNil(path) && !isNil(databaseFullPath)) {
            return {path, databaseFullPath, useMetaProxy};
        }
        return undefined;
    }, [path, databaseFullPath, useMetaProxy]);

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
            loading={isLoading}
            error={error}
            nodeId={nodeId}
        />
    );
}
