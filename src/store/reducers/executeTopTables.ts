import type {ThunkAction} from 'redux-thunk';
import type {AnyAction, Reducer} from 'redux';

import type {IQueryResult} from '../../types/store/query';
import type {TopTablesAction, TopTablesState} from '../../types/store/executeTopTables';
import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createApiRequest, createRequestActionTypes} from '../utils';
import type {RootState} from '.';

export const FETCH_TOP_TABLES = createRequestActionTypes('top-tables', 'FETCH_TOP_TABLES');
const SET_TOP_TABLES_STATE = 'top-tables/SET_TOP_TABLES_STATE';

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
    LIMIT 5
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
        case SET_TOP_TABLES_STATE:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

type FetchTopTables = (params: {
    database: string;
}) => ThunkAction<Promise<IQueryResult | undefined>, RootState, unknown, AnyAction>;

export const fetchTopTables: FetchTopTables =
    ({database}) =>
    async (dispatch, getState) => {
        try {
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
            })(dispatch, getState);
        } catch (error) {
            dispatch({
                type: FETCH_TOP_TABLES.FAILURE,
                error,
            });

            throw error;
        }
    };

export function setTopTablesState(state: Partial<TopTablesState>) {
    return {
        type: SET_TOP_TABLES_STATE,
        data: state,
    } as const;
}

export default executeTopTables;
