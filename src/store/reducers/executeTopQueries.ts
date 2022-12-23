import type {Reducer} from 'redux';

import '../../services/api';
import {ITopQueriesAction, ITopQueriesState} from '../../types/store/executeTopQueries';

import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_TOP_QUERIES = createRequestActionTypes('top-queries', 'FETCH_TOP_QUERIES');
const SET_TOP_QUERIES_STATE = 'top-queries/SET_TOP_QUERIES_STATE';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const getQueryText = (path: string) => `
--!syntax_v1
$last = (
    SELECT
        MAX(IntervalEnd)
    FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
);
SELECT
    CPUTime as CPUTimeUs,
    QueryText
FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
WHERE IntervalEnd IN $last
`;

const executeTopQueries: Reducer<ITopQueriesState, ITopQueriesAction> = (
    state = initialState,
    action,
) => {
    switch (action.type) {
        case FETCH_TOP_QUERIES.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case FETCH_TOP_QUERIES.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case FETCH_TOP_QUERIES.FAILURE: {
            return {
                ...state,
                error: action.error || 'Unauthorized',
                loading: false,
            };
        }
        case SET_TOP_QUERIES_STATE:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

interface FetchTopQueriesParams {
    database: string;
}

export const fetchTopQueries = ({database}: FetchTopQueriesParams) => {
    return createApiRequest({
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
        actions: FETCH_TOP_QUERIES,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export function setTopQueriesState(state: Partial<ITopQueriesState>) {
    return {
        type: SET_TOP_QUERIES_STATE,
        data: state,
    } as const;
}

export default executeTopQueries;
