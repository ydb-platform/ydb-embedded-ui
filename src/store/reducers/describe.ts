import {createSelector} from 'reselect';

import '../../services/api';
import {TEvDescribeSchemeResult} from '../../types/api/schema';
import {IConsumer} from '../../types/api/consumers';
import {createRequestActionTypes, createApiRequest, ApiRequestAction} from '../utils';

const FETCH_DESCRIBE = createRequestActionTypes('describe', 'FETCH_DESCRIBE');

const describe = (
    state = {loading: false, wasLoaded: false, data: {}},
    action: ApiRequestAction<typeof FETCH_DESCRIBE, TEvDescribeSchemeResult, unknown>,
) => {
    switch (action.type) {
        case FETCH_DESCRIBE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_DESCRIBE.SUCCESS: {
            let newData;

            if (action.data.Path) {
                newData = JSON.parse(JSON.stringify(state.data));
                newData[action.data.Path] = action.data;
            } else {
                newData = state.data;
            }

            return {
                ...state,
                data: newData,
                currentDescribe: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_DESCRIBE.FAILURE: {
            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        default:
            return state;
    }
};

// Consumers selectors
const selectConsumersNames = (state: any, path: string): string[] | undefined =>
    state.describe.data[path]?.PathDescription?.PersQueueGroup?.PQTabletConfig?.ReadRules;

export const selectConsumers = createSelector(selectConsumersNames, (names = []): IConsumer[] => {
    const consumers = names.map((name) => {
        return {name};
    });

    return consumers;
});

export function getDescribe({path}: {path: string}) {
    return createApiRequest({
        request: window.api.getDescribe({path}),
        actions: FETCH_DESCRIBE,
    });
}

export default describe;
