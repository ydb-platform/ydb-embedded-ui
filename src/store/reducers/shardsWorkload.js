import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';

const SEND_SHARD_QUERY = createRequestActionTypes('query', 'SEND_SHARD_QUERY');
const SET_SHARD_QUERY_OPTIONS = 'query/SET_SHARD_QUERY_OPTIONS';

const initialState = {
    loading: false,
    wasLoaded: false,
};

function formatSortOrder({columnId, order}) {
    return `${columnId} ${order}`;
}

function createShardQuery(path, sortOrder, tenantName) {
    const orderBy = Array.isArray(sortOrder) ?
        `ORDER BY ${sortOrder.map(formatSortOrder).join(', ')}` :
        '';

    const pathSelect = tenantName ?
        `CAST(SUBSTRING(CAST(Path AS String), ${tenantName.length}) AS Utf8) AS Path` :
        'Path';

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

const shardsWorkload = (state = initialState, action) => {
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

export const sendShardQuery = ({database, path = '', sortOrder}) => {
    return createApiRequest({
        request: window.api.sendQuery({
            query: createShardQuery(path, sortOrder, database),
            database,
            action: queryAction,
        }, {
            concurrentId: 'topShards',
        }),
        actions: SEND_SHARD_QUERY,
        dataHandler: (result) => {
            if (result && typeof result === 'string') {
                throw 'Unexpected token in JSON.';
            }

            return result;
        },
    });
};

export function setShardQueryOptions(options) {
    return {
        type: SET_SHARD_QUERY_OPTIONS,
        data: options,
    };
}

export default shardsWorkload;
