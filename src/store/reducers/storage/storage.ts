import type {Reducer} from 'redux';
import _ from 'lodash';

import {NodesUptimeFilterValues} from '../../../utils/nodes';
import '../../../services/api';

import {createRequestActionTypes, createApiRequest} from '../../utils';

import type {StorageAction, StorageState, StorageType, VisibleEntities} from './types';
import {VISIBLE_ENTITIES, STORAGE_TYPES} from './constants';

export const FETCH_STORAGE = createRequestActionTypes('storage', 'FETCH_STORAGE');

const SET_INITIAL = 'storage/SET_INITIAL';
const SET_FILTER = 'storage/SET_FILTER';
const SET_USAGE_FILTER = 'storage/SET_USAGE_FILTER';
const SET_VISIBLE_GROUPS = 'storage/SET_VISIBLE_GROUPS';
const SET_STORAGE_TYPE = 'storage/SET_STORAGE_TYPE';
const SET_NODES_UPTIME_FILTER = 'storage/SET_NODES_UPTIME_FILTER';
const SET_DATA_WAS_NOT_LOADED = 'storage/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: true,
    wasLoaded: false,
    filter: '',
    usageFilter: [],
    visible: VISIBLE_ENTITIES.missing,
    nodesUptimeFilter: NodesUptimeFilterValues.All,
    type: STORAGE_TYPES.groups,
};

const storage: Reducer<StorageState, StorageAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_STORAGE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_STORAGE.SUCCESS: {
            return {
                ...state,
                nodes: action.data.nodes,
                groups: action.data.groups,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_STORAGE.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
                wasLoaded: true,
            };
        }
        case SET_INITIAL: {
            return {
                ...initialState,
            };
        }
        case SET_FILTER: {
            return {
                ...state,
                filter: action.data,
            };
        }
        case SET_USAGE_FILTER: {
            return {
                ...state,
                usageFilter: action.data,
            };
        }
        case SET_VISIBLE_GROUPS: {
            return {
                ...state,
                visible: action.data,
                wasLoaded: false,
                error: undefined,
            };
        }

        case SET_NODES_UPTIME_FILTER: {
            return {
                ...state,
                nodesUptimeFilter: action.data,
            };
        }
        case SET_STORAGE_TYPE: {
            return {
                ...state,
                type: action.data,
                filter: '',
                usageFilter: [],
                wasLoaded: false,
                error: undefined,
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

export function getStorageInfo(
    {
        tenant,
        visibleEntities,
        nodeId,
        type,
    }: {
        tenant?: string;
        visibleEntities?: VisibleEntities;
        nodeId?: string;
        type?: StorageType;
    },
    {concurrentId}: {concurrentId: string},
) {
    if (type === STORAGE_TYPES.nodes) {
        return createApiRequest({
            request: window.api.getNodes({tenant, visibleEntities, type: 'static'}, {concurrentId}),
            actions: FETCH_STORAGE,
            dataHandler: (data) => ({nodes: data}),
        });
    }

    return createApiRequest({
        request: window.api.getStorageInfo({tenant, visibleEntities, nodeId}, {concurrentId}),
        actions: FETCH_STORAGE,
        dataHandler: (data) => ({groups: data}),
    });
}

export function setInitialState() {
    return {
        type: SET_INITIAL,
    } as const;
}

export function setStorageType(value: StorageType) {
    return {
        type: SET_STORAGE_TYPE,
        data: value,
    } as const;
}

export function setStorageFilter(value: string) {
    return {
        type: SET_FILTER,
        data: value,
    } as const;
}

export function setUsageFilter(value: string[]) {
    return {
        type: SET_USAGE_FILTER,
        data: value,
    } as const;
}

export function setVisibleEntities(value: VisibleEntities) {
    return {
        type: SET_VISIBLE_GROUPS,
        data: value,
    } as const;
}

export function setNodesUptimeFilter(value: NodesUptimeFilterValues) {
    return {
        type: SET_NODES_UPTIME_FILTER,
        data: value,
    } as const;
}

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export default storage;
