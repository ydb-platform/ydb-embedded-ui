import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';
import {StringParam, useQueryParams} from 'use-query-params';

import {useClusterWithProxy} from '../../store/reducers/cluster/cluster';
import {selectTabletsWithFqdn, tabletsApi} from '../../store/reducers/tablets';
import {ETabletState} from '../../types/api/tablet';
import type {TabletsApiRequestParams} from '../../types/store/tablets';
import {valueIsDefined} from '../../utils';
import {useAutoRefreshInterval, useTypedSelector} from '../../utils/hooks';

import {TabletsTable} from './TabletsTable';

const TABLET_ID_SEARCH_DEBOUNCE = 1000;
const TABLET_ID_PATTERN = /^\d+$/;

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

    // When tablets are opened on a database page, allow searching for any
    // tablet of the database via the backend. On other schema objects the
    // search remains client-side over the already loaded tablets list.
    const isDatabasePage = !isNil(path) && !isNil(databaseFullPath) && path === databaseFullPath;

    const [{tabletsSearch}] = useQueryParams({tabletsSearch: StringParam});

    // Debounce the search value before sending it to the backend, since the
    // request can be heavy.
    const [debouncedSearch, setDebouncedSearch] = React.useState(tabletsSearch ?? '');
    React.useEffect(() => {
        const value = tabletsSearch ?? '';
        const timer = window.setTimeout(() => {
            setDebouncedSearch(value);
        }, TABLET_ID_SEARCH_DEBOUNCE);
        return () => {
            window.clearTimeout(timer);
        };
    }, [tabletsSearch]);

    const useBackendSearch = isDatabasePage && TABLET_ID_PATTERN.test(debouncedSearch);

    const filterParts: string[] = [];
    if (useBackendSearch) {
        filterParts.push(`TabletId=${debouncedSearch}`);
    }
    if (onlyActive) {
        filterParts.push(`State=[${activeStatuses.join(',')}]`);
    }
    const filter = filterParts.length ? `(${filterParts.join(';')})` : undefined;

    const schemaPathParam = React.useMemo(() => {
        if (!isNil(path) && !isNil(databaseFullPath)) {
            return {path, databaseFullPath, useMetaProxy};
        }
        return undefined;
    }, [path, databaseFullPath, useMetaProxy]);

    let params: TabletsApiRequestParams = {};
    if (valueIsDefined(nodeId)) {
        params = {nodeId, database, filter};
    } else if (useBackendSearch) {
        // Search across the entire database: omit the schema path so the
        // backend returns any tablet with the given TabletId.
        params = {database, filter};
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
