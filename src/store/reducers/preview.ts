import '../../services/api';

import type {ErrorRepsonse, ExecuteActions} from '../../types/api/query';
import type {IQueryResult} from '../../types/store/query';
import {parseQueryAPIExecuteResponse} from '../../utils/query';

import {createRequestActionTypes, createApiRequest, ApiRequestAction} from '../utils';

const SEND_QUERY = createRequestActionTypes('preview', 'SEND_QUERY');
const SET_QUERY_OPTIONS = 'preview/SET_QUERY_OPTIONS';

const initialState = {
    loading: false,
    wasLoaded: false,
};

const preview = (
    state = initialState,
    action: ApiRequestAction<typeof SEND_QUERY, IQueryResult, ErrorRepsonse> | ReturnType<typeof setQueryOptions>,
) => {
    switch (action.type) {
        case SEND_QUERY.REQUEST: {
            return {
                ...state,
                loading: true,
                error: undefined,
            };
        }
        case SEND_QUERY.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                error: undefined,
                wasLoaded: true,
            };
        }
        // 401 Unauthorized error is handled by GenericAPI
        case SEND_QUERY.FAILURE: {
            return {
                ...state,
                error: action.error || 'Unauthorized',
                loading: false,
            };
        }
        case SET_QUERY_OPTIONS:
            return {
                ...state,
                ...action.data,
            };
        default:
            return state;
    }
};

interface SendQueryParams {
    query?: string;
    database?: string;
    action?: ExecuteActions;
};

export const sendQuery = ({query, database, action}: SendQueryParams) => {
    return createApiRequest({
        request: window.api.sendQuery({schema: 'modern', query, database, action}),
        actions: SEND_QUERY,
        dataHandler: parseQueryAPIExecuteResponse,
    });
};

export function setQueryOptions(options: any) {
    return {
        type: SET_QUERY_OPTIONS,
        data: options,
    } as const;
}

export default preview;
