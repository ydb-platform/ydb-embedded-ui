import {Reducer} from 'redux';

import '../../services/api';
import type {
    IDescribeState,
    IDescribeAction,
    IDescribeHandledResponse,
    IDescribeData,
} from '../../types/store/describe';
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
            const isCurrentDescribePath = action.data.path === state.currentDescribePath;
            const newData = {...state.data, ...action.data.data};

            if (!isCurrentDescribePath) {
                return {
                    ...state,
                    data: newData,
                };
            }

            return {
                ...state,
                data: newData,
                currentDescribe: action.data.currentDescribe,
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

export function getDescribe({path}: {path: string}) {
    const request = window.api.getDescribe({path});
    return createApiRequest({
        request,
        actions: FETCH_DESCRIBE,
        dataHandler: (data): IDescribeHandledResponse => {
            const dataPath = data.Path;
            const currentDescribe: IDescribeData = {};
            const newData: IDescribeData = {};

            if (dataPath) {
                currentDescribe[dataPath] = data;
                newData[dataPath] = data;
            }

            return {
                path: dataPath,
                currentDescribe,
                data: newData,
            };
        },
    });
}

export function getDescribeBatched(paths: string[]) {
    const requestsArray = paths.map((p) => window.api.getDescribe({path: p}));

    const request = Promise.all(requestsArray);
    return createApiRequest({
        request,
        actions: FETCH_DESCRIBE,
        dataHandler: (data): IDescribeHandledResponse => {
            const currentDescribe: IDescribeData = {};
            const newData: IDescribeData = {};

            data.forEach((dataItem) => {
                if (dataItem.Path) {
                    newData[dataItem.Path] = dataItem;
                    currentDescribe[dataItem.Path] = dataItem;
                }
            });

            return {
                path: data[0].Path,
                currentDescribe,
                data: newData,
            };
        },
    });
}

export default describe;
