import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const FETCH_OLAP_STATS = createRequestActionTypes('query', 'SEND_OLAP_STATS_QUERY');
const SET_OLAP_STATS_OPTIONS = createRequestActionTypes('query', 'SET_OLAP_STATS_OPTIONS');

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
        default:
            return state;
    }
};

export const getOlapStats = ({path = ''}) => {
    return createApiRequest({
        request: window.api.sendQuery({
            query: createOlatStatsQuery(path),
            database: path,
            action: queryAction,
        }),
        actions: FETCH_OLAP_STATS,
        dataHandler: (result) => {
            if (result && typeof result === 'string') {
                throw 'Unexpected token in JSON.';
            }

            return result;
        },
    });
};

export function setOlapStatsOptions(options) {
    return {
        type: SET_OLAP_STATS_OPTIONS,
        data: options,
    };
}

export default olapStats;
