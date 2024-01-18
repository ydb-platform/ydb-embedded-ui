import type {AnyAction, Reducer} from 'redux';
import type {ThunkAction} from 'redux-thunk';

import type {IQueryResult} from '../../../types/store/query';
import {parseQueryAPIExecuteResponse} from '../../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../../utils';
import type {RootState} from '..';
import type {ITopQueriesAction, ITopQueriesFilters, ITopQueriesState} from './types';
import {getFiltersConditions} from './utils';

export const FETCH_TOP_QUERIES = createRequestActionTypes('top-queries', 'FETCH_TOP_QUERIES');
const SET_TOP_QUERIES_STATE = 'top-queries/SET_TOP_QUERIES_STATE';
const SET_TOP_QUERIES_FILTERS = 'top-queries/SET_TOP_QUERIES_FILTERS';

const initialState = {
    loading: false,
    wasLoaded: false,
    filters: {},
};

const getQueryText = (path: string, filters?: ITopQueriesFilters) => {
    const filterConditions = getFiltersConditions(path, filters);
    return `
SELECT
    CPUTime as CPUTimeUs,
    QueryText,
    IntervalEnd,
    EndTime,
    ReadRows,
    ReadBytes,
    UserSID
FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
WHERE ${filterConditions || 'true'}
`;
};

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
        case SET_TOP_QUERIES_FILTERS:
            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...action.filters,
                },
            };
        default:
            return state;
    }
};

type FetchTopQueries = (params: {
    database: string;
    filters?: ITopQueriesFilters;
}) => ThunkAction<Promise<IQueryResult | undefined>, RootState, unknown, AnyAction>;

export const fetchTopQueries: FetchTopQueries = ({database, filters}) =>
    createApiRequest({
        request: window.api.sendQuery(
            {
                schema: 'modern',
                query: getQueryText(database, filters),
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

export function setTopQueriesState(state: Partial<ITopQueriesState>) {
    return {
        type: SET_TOP_QUERIES_STATE,
        data: state,
    } as const;
}

export function setTopQueriesFilters(filters: Partial<ITopQueriesFilters>) {
    return {
        type: SET_TOP_QUERIES_FILTERS,
        filters,
    } as const;
}

export default executeTopQueries;
