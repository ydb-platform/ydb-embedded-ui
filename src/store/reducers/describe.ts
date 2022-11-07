import {createSelector, Selector} from 'reselect';
import {Reducer} from 'redux';

import '../../services/api';
import {IConsumer} from '../../types/api/consumers';
import {
    IDescribeRootStateSlice,
    IDescribeState,
    IDescribeData,
    IDescribeAction,
    IDescribeFetchAdditionalParams,
} from '../../types/store/describe';
import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_DESCRIBE = createRequestActionTypes('describe', 'FETCH_DESCRIBE');

const initialState = {
    loading: true,
    wasLoaded: false,
    data: {},
    currentDescribe: undefined,
    currentDescribePath: undefined,
};

const describe: Reducer<IDescribeState, IDescribeAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_DESCRIBE.REQUEST: {
            // Reset loading helps to keep correct loader render on tabs or path change
            const resetLoading = action.additionalParams?.resetLoadingState;
            const wasLoaded = resetLoading ? false : state.wasLoaded;

            // Current describe corresponds to current path, this prevents rendering incorrect data
            // when path is changed
            const newPath = action.additionalParams?.currentDescribePath;
            const currentDescribePath = newPath || state.currentDescribePath;

            return {
                ...state,
                loading: true,
                wasLoaded,
                currentDescribePath,
            };
        }
        case FETCH_DESCRIBE.SUCCESS: {
            const data = action.data;

            const currentDescribePath = action.additionalParams?.currentDescribePath;
            const isCurrentDescribePath = currentDescribePath === state.currentDescribePath;

            let newData: IDescribeData = {},
                currentDescribe: any = {},
                wasLoaded = true;

            if (Array.isArray(data)) {
                newData = JSON.parse(JSON.stringify(state.data));

                data.forEach((item) => {
                    if (item.Path) {
                        newData[item.Path] = item;
                        if (isCurrentDescribePath) {
                            currentDescribe[item.Path] = item;
                        }
                    }
                });
            } else {
                if (data.Path) {
                    newData = JSON.parse(JSON.stringify(state.data));
                    newData[data.Path] = data;
                    if (isCurrentDescribePath) {
                        currentDescribe = data;
                    }
                }
            }

            // Do not reset wasLoaded state if it is not loading current path describe
            // May be needed in case of schema switch while data has not been loaded
            if (!isCurrentDescribePath) {
                wasLoaded = state.wasLoaded;
            }

            return {
                ...state,
                data: newData || state.data,
                currentDescribe: currentDescribe || state.currentDescribe,
                loading: false,
                wasLoaded: wasLoaded,
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
                wasLoaded: true,
                loading: false,
            };
        }
        default:
            return state;
    }
};

// Consumers selectors
const selectConsumersNames: Selector<IDescribeRootStateSlice, string[] | undefined, [string]> = (
    state,
    path,
) => state.describe.data[path]?.PathDescription?.PersQueueGroup?.PQTabletConfig?.ReadRules;

export const selectConsumers: Selector<IDescribeRootStateSlice, IConsumer[]> = createSelector(
    selectConsumersNames,
    (names = []) => {
        const consumers = names.map((name) => {
            return {name};
        });

        return consumers;
    },
);

export function getDescribe(
    {path}: {path: string | string[]},
    additionalParams?: IDescribeFetchAdditionalParams,
) {
    let request;

    if (Array.isArray(path)) {
        request = path.map((p) => window.api.getDescribe({path: p}));
    } else {
        request = window.api.getDescribe({path});
    }

    return createApiRequest({
        request,
        actions: FETCH_DESCRIBE,
        additionalParams,
    });
}

export default describe;
