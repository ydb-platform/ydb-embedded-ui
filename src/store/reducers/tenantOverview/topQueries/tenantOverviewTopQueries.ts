import type {Reducer} from '@reduxjs/toolkit';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {parseQueryAPIExecuteResponse} from '../../../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../../../utils';
import type {TenantOverviewTopQueriesAction, TenantOverviewTopQueriesState} from './types';

export const FETCH_TENANT_OVERVIEW_TOP_QUERIES = createRequestActionTypes(
    'tenantOverviewTopQueries',
    'FETCH_TOP_QUERIES',
);
const SET_DATA_WAS_NOT_LOADED = 'tenantOverviewTopQueries/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
    filters: {},
};

const getQueryText = (path: string) => {
    return `
SELECT
    CPUTime as CPUTimeUs,
    QueryText,
FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
ORDER BY CPUTimeUs DESC
LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}
`;
};

export const tenantOverviewTopQueries: Reducer<
    TenantOverviewTopQueriesState,
    TenantOverviewTopQueriesAction
> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TENANT_OVERVIEW_TOP_QUERIES.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case FETCH_TENANT_OVERVIEW_TOP_QUERIES.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case FETCH_TENANT_OVERVIEW_TOP_QUERIES.FAILURE: {
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

export const fetchTenantOverviewTopQueries = (database: string) =>
    createApiRequest({
        request: window.api.sendQuery(
            {
                schema: 'modern',
                query: getQueryText(database),
                database,
                action: 'execute-scan',
            },
            {
                concurrentId: 'executeTopQueries',
            },
        ),
        actions: FETCH_TENANT_OVERVIEW_TOP_QUERIES,
        dataHandler: parseQueryAPIExecuteResponse,
    });

export function setDataWasNotLoaded() {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
}
