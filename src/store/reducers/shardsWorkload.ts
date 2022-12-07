import type {Reducer} from 'redux';

import '../../services/api';
import type {IShardsWorkloadAction, IShardsWorkloadState} from '../../types/store/shardsWorkload';

import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const SEND_SHARD_QUERY = createRequestActionTypes('query', 'SEND_SHARD_QUERY');
const SET_SHARD_QUERY_OPTIONS = 'query/SET_SHARD_QUERY_OPTIONS';

const initialState = {
    loading: false,
    wasLoaded: false,
};

export interface SortOrder {
    columnId: string;
    order: string;
}

function formatSortOrder({columnId, order}: SortOrder) {
    return `${columnId} ${order}`;
}

function createShardQuery(path: string, sortOrder?: SortOrder[], tenantName?: string) {
    const orderBy = sortOrder ? `ORDER BY ${sortOrder.map(formatSortOrder).join(', ')}` : '';

    const pathSelect = tenantName
        ? `CAST(SUBSTRING(CAST(Path AS String), ${tenantName.length}) AS Utf8) AS Path`
        : 'Path';

    return `SELECT
    ${pathSelect},
    TabletId,
    CPUCores,
    DataSize
FROM \`.sys/partition_stats\`
WHERE
    Path='${path}'
    OR Path LIKE '${path}/%'
${orderBy}
LIMIT 20`;
}

const queryAction = 'execute-scan';

const shardsWorkload: Reducer<IShardsWorkloadState, IShardsWorkloadAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case SEND_SHARD_QUERY.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case SEND_SHARD_QUERY.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case SEND_SHARD_QUERY.FAILURE: {
            return {
                ...state,
                error: action.error || 'Unauthorized',
                loading: false,
            };
        }
        case SET_SHARD_QUERY_OPTIONS:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

interface SendShardQueryParams {
    database?: string;
    path?: string;
    sortOrder?: SortOrder[];
}

export const sendShardQuery = ({database, path = '', sortOrder}: SendShardQueryParams) => {
    return createApiRequest({
        request: window.api.sendQuery({
            schema: 'modern',
            query: createShardQuery(path, sortOrder, database),
            database,
            action: queryAction,
        }, {
            concurrentId: 'topShards',
        }),
        actions: SEND_SHARD_QUERY,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export function setShardQueryOptions(options: Partial<IShardsWorkloadState>) {
    return {
        type: SET_SHARD_QUERY_OPTIONS,
        data: options,
    } as const;
}

export default shardsWorkload;
