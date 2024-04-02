import type {Reducer} from '@reduxjs/toolkit';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {parseQueryAPIExecuteResponse} from '../../../../utils/query';
import {createApiRequest, createRequestActionTypes} from '../../../utils';

import type {TenantOverviewTopShardsAction, TenantOverviewTopShardsState} from './types';

export const FETCH_TENANT_OVERVIEW_TOP_SHARDS = createRequestActionTypes(
    'tenantOverviewTopShards',
    'FETCH_TENANT_OVERVIEW_TOP_SHARDS',
);
const SET_DATA_WAS_NOT_LOADED = 'tenantOverviewTopShards/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

function createShardQuery(path: string, tenantName?: string) {
    const pathSelect = tenantName
        ? `CAST(SUBSTRING(CAST(Path AS String), ${tenantName.length}) AS Utf8) AS Path`
        : 'Path';

    return `SELECT
    ${pathSelect},
    TabletId,
    CPUCores,
FROM \`.sys/partition_stats\`
WHERE
    Path='${path}'
    OR Path LIKE '${path}/%'
ORDER BY CPUCores DESC
LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}`;
}

const queryAction = 'execute-scan';

export const tenantOverviewTopShards: Reducer<
    TenantOverviewTopShardsState,
    TenantOverviewTopShardsAction
> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TENANT_OVERVIEW_TOP_SHARDS.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case FETCH_TENANT_OVERVIEW_TOP_SHARDS.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case FETCH_TENANT_OVERVIEW_TOP_SHARDS.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error || 'Unauthorized',
                loading: false,
            };
        }
        case SET_DATA_WAS_NOT_LOADED:
            return {
                ...state,
                wasLoaded: false,
            };
        default:
            return state;
    }
};

export const sendTenantOverviewTopShardsQuery = (database: string, path = '') =>
    createApiRequest({
        request: window.api.sendQuery(
            {
                schema: 'modern',
                query: createShardQuery(path, database),
                database,
                action: queryAction,
            },
            {
                concurrentId: 'executeTopShards',
            },
        ),
        actions: FETCH_TENANT_OVERVIEW_TOP_SHARDS,
        dataHandler: parseQueryAPIExecuteResponse,
    });

export function setDataWasNotLoaded() {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
}
