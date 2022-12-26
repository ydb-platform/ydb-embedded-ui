import type {AnyAction, Reducer} from 'redux';
import type {ThunkAction} from 'redux-thunk';

import '../../services/api';
import {
    ITopQueriesAction,
    ITopQueriesFilters,
    ITopQueriesState,
} from '../../types/store/executeTopQueries';
import {IQueryResult} from '../../types/store/query';

import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../utils';

import type {IRootState} from '.';

export const FETCH_TOP_QUERIES = createRequestActionTypes('top-queries', 'FETCH_TOP_QUERIES');
const SET_TOP_QUERIES_STATE = 'top-queries/SET_TOP_QUERIES_STATE';
const SET_TOP_QUERIES_FILTERS = 'top-queries/SET_TOP_QUERIES_FILTERS';

const initialState = {
    loading: false,
    wasLoaded: false,
    filters: {},
};

const getMaxIntervalSubquery = (path: string) => `(
    SELECT
        MAX(IntervalEnd)
    FROM \`${path}/.sys/top_queries_by_cpu_time_one_hour\`
)`;

function getFiltersConditions(path: string, filters?: ITopQueriesFilters) {
    const conditions: string[] = [];

    if (filters?.from && filters?.to && filters.from > filters.to) {
        throw new Error('Invalid date range');
    }

    if (filters?.from) {
        // matching `from` & `to` is an edge case
        // other cases should not include the starting point, since intervals are stored using the ending time
        const gt = filters.to === filters.from ? '>=' : '>';
        conditions.push(`IntervalEnd ${gt} Timestamp('${new Date(filters.from).toISOString()}')`);
    }

    if (filters?.to) {
        conditions.push(`IntervalEnd <= Timestamp('${new Date(filters.to).toISOString()}')`);
    }

    if (!filters?.from && !filters?.to) {
        conditions.push(`IntervalEnd IN ${getMaxIntervalSubquery(path)}`);
    }

    if (filters?.text) {
        conditions.push(`QueryText ILIKE '%${filters.text}%'`);
    }

    return conditions.join(' AND ');
}

const getQueryText = (path: string, filters?: ITopQueriesFilters) => {
    const filterConditions = getFiltersConditions(path, filters);
    return `
SELECT
    CPUTime as CPUTimeUs,
    QueryText,
    IntervalEnd
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
}) => ThunkAction<Promise<IQueryResult | undefined>, IRootState, unknown, AnyAction>;

export const fetchTopQueries: FetchTopQueries =
    ({database, filters}) =>
    async (dispatch, getState) => {
        try {
            return createApiRequest({
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
            })(dispatch, getState);
        } catch (error) {
            dispatch({
                type: FETCH_TOP_QUERIES.FAILURE,
                error,
            });

            throw error;
        }
    };

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
