import {createSelector, Selector} from 'reselect';
import {Reducer} from 'redux';

import '../../services/api';
import {IConsumer} from '../../types/api/consumers';
import {IDescribeRootStateSlice, IDescribeState, IDescribeAction} from '../../types/store/describe';
import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_DESCRIBE = createRequestActionTypes('describe', 'FETCH_DESCRIBE');
const SET_CURRENT_DESCRIBE_PATH = 'describe/SET_CURRENT_DESCRIBE_PATH';
const SET_DATA_WAS_NOT_LOADED = 'describe/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: false,
    wasLoaded: false,
    data: {},
    currentDescribe: undefined,
    currentDescribePath: undefined,
};

const describe: Reducer<IDescribeState, IDescribeAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_DESCRIBE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_DESCRIBE.SUCCESS: {
            const data = action.data;

            const isCurrentDescribePath = data.Path === state.currentDescribePath;

            let newData = state.data;

            if (data.Path) {
                newData = JSON.parse(JSON.stringify(state.data));
                newData[data.Path] = data;
            }

            if (!isCurrentDescribePath) {
                return {
                    ...state,
                    data: newData,
                };
            }

            return {
                ...state,
                data: newData,
                currentDescribe: data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }

        case FETCH_DESCRIBE.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_CURRENT_DESCRIBE_PATH: {
            return {
                ...state,
                currentDescribePath: action.data,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export const setCurrentDescribePath = (path: string) => {
    return {
        type: SET_CURRENT_DESCRIBE_PATH,
        data: path,
    } as const;
};

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

// Consumers selectors
const selectConsumersNames = (state: IDescribeRootStateSlice, path: string | undefined) =>
    path
        ? state.describe.data[path]?.PathDescription?.PersQueueGroup?.PQTabletConfig?.ReadRules
        : undefined;

export const selectConsumers: Selector<IDescribeRootStateSlice, IConsumer[], [string | undefined]> =
    createSelector(selectConsumersNames, (names = []) => names.map((name) => ({name})));

export function getDescribe({path}: {path: string}) {
    return createApiRequest({
        request: window.api.getDescribe({path}),
        actions: FETCH_DESCRIBE,
    });
}

export default describe;
