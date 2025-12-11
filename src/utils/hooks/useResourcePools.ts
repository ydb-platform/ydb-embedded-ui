import React from 'react';

import {queryApi} from '../../store/reducers/query/query';
import {RESOURCE_POOL_NO_OVERRIDE_VALUE} from '../query';
import type {ResourcePoolValue} from '../query';

type UseResourcePoolsResult = {
    resourcePools: string[];
    normalizedResourcePool: ResourcePoolValue;
    isLoading: boolean;
    isFetching: boolean;
    error?: unknown;
};

export const useResourcePools = (
    database: string | undefined,
    resourcePool: ResourcePoolValue | undefined,
): UseResourcePoolsResult => {
    const {
        data: resourcePools = [],
        isLoading,
        isFetching,
        error,
    } = queryApi.useGetResourcePoolsQuery(
        {database: database || ''},
        {
            skip: !database,
        },
    );

    const normalizedResourcePool = React.useMemo<ResourcePoolValue>(() => {
        if (!resourcePool || resourcePool === RESOURCE_POOL_NO_OVERRIDE_VALUE) {
            return RESOURCE_POOL_NO_OVERRIDE_VALUE;
        }

        if (!resourcePools.length) {
            // If we couldn't get pools for any reason, fall back to no override
            return RESOURCE_POOL_NO_OVERRIDE_VALUE;
        }

        return resourcePools.includes(resourcePool)
            ? resourcePool
            : RESOURCE_POOL_NO_OVERRIDE_VALUE;
    }, [resourcePool, resourcePools]);

    return {resourcePools, normalizedResourcePool, isLoading, isFetching, error};
};
