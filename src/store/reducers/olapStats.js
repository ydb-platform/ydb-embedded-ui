import '../../services/api';

import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest} from '../utils';

const FETCH_OLAP_STATS = createRequestActionTypes('query', 'SEND_OLAP_STATS_QUERY');
const SET_OLAP_STATS_OPTIONS = createRequestActionTypes('query', 'SET_OLAP_STATS_OPTIONS');
const RESET_LOADING_STATE = 'olapStats/RESET_LOADING_STATE';

const initialState = {
    loading: false,
    wasLoaded: false,
};

function createOlatStatsQuery(path) {
    return `SELECT * FROM \`${path}/.sys/primary_index_stats\``;
}

const queryAction = 'execute-scan';

const olapStats = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_OLAP_STATS.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case FETCH_OLAP_STATS.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        case FETCH_OLAP_STATS.FAILURE: {
            return {
                ...state,
                error: action.error || 'Unauthorized',
                loading: false,
            };
        }
        case SET_OLAP_STATS_OPTIONS:
            return {
                ...state,
                ...action.data,
            };
        case RESET_LOADING_STATE: {
            return {
                ...state,
                wasLoaded: initialState.wasLoaded,
            };
        }
        default:
            return state;
    }
};

export const getOlapStats = ({path = ''}) => {
    return createApiRequest({
        request: window.api.sendQuery({
            schema: 'modern',
            query: createOlatStatsQuery(path),
            database: path,
            action: queryAction,
        }),
        actions: FETCH_OLAP_STATS,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export function setOlapStatsOptions(options) {
    return {
        type: SET_OLAP_STATS_OPTIONS,
        data: options,
    };
}

export function resetLoadingState() {
    return {
        type: RESET_LOADING_STATE,
    };
}

export default olapStats;
