import type {Reducer} from 'redux';

import {TENANT_OVERVIEW_TABLES_LIMIT} from '../../../../utils/constants';
import {parseQueryAPIExecuteResponse} from '../../../../utils/query';
import {createApiRequest, createRequestActionTypes} from '../../../utils';
import type {TopTablesAction, TopTablesState} from './types';

export const FETCH_TOP_TABLES = createRequestActionTypes('top-tables', 'FETCH_TOP_TABLES');
const SET_DATA_WAS_NOT_LOADED = 'top-tables/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const getQueryText = (path: string) => {
    return `
SELECT
    Path, SUM(DataSize) as Size
FROM \`${path}/.sys/partition_stats\`
GROUP BY Path
    ORDER BY Size DESC
    LIMIT ${TENANT_OVERVIEW_TABLES_LIMIT}
`;
};

const executeTopTables: Reducer<TopTablesState, TopTablesAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_TOP_TABLES.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case FETCH_TOP_TABLES.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case FETCH_TOP_TABLES.FAILURE: {
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

export const fetchTopTables = (database: string) => {
    return createApiRequest({
        request: window.api.sendQuery(
            {
                schema: 'modern',
                query: getQueryText(database),
                database,
                action: 'execute-scan',
            },
            {
                concurrentId: 'executeTopTables',
            },
        ),
        actions: FETCH_TOP_TABLES,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export function setDataWasNotLoaded() {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
}

export default executeTopTables;
