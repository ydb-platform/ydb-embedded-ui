import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {EVersion} from '../../../types/api/storage';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {api} from '../api';
import type {NodesApiRequestParams, NodesSortParams} from '../nodes/types';

import {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';
import type {
    StorageApiRequestParams,
    StorageSortParams,
    StorageState,
    StorageType,
    VisibleEntities,
} from './types';
import {prepareStorageGroupsResponse, prepareStorageNodesResponse} from './utils';

const initialState: StorageState = {
    filter: '',
    usageFilter: [],
    visible: VISIBLE_ENTITIES.all,
    uptimeFilter: NodesUptimeFilterValues.All,
    type: STORAGE_TYPES.groups,
};

const slice = createSlice({
    name: 'storage',
    initialState,
    reducers: {
        setUptimeFilter: (state, action: PayloadAction<NodesUptimeFilterValues>) => {
            state.uptimeFilter = action.payload;
        },
        setStorageType: (state, action: PayloadAction<StorageType>) => {
            state.type = action.payload;
        },
        setStorageTextFilter: (state, action: PayloadAction<string>) => {
            state.filter = action.payload;
        },
        setUsageFilter: (state, action: PayloadAction<string[]>) => {
            state.usageFilter = action.payload;
        },
        setVisibleEntities: (state, action: PayloadAction<VisibleEntities>) => {
            state.visible = action.payload;
        },
        setNodesSortParams: (state, action: PayloadAction<NodesSortParams>) => {
            state.nodesSortValue = action.payload.sortValue;
            state.nodesSortOrder = action.payload.sortOrder;
        },
        setGroupsSortParams: (state, action: PayloadAction<StorageSortParams>) => {
            state.groupsSortValue = action.payload.sortValue;
            state.groupsSortOrder = action.payload.sortOrder;
        },
        setInitialState: () => {
            return initialState;
        },
    },
});

export default slice.reducer;

export const {
    setInitialState,
    setStorageTextFilter,
    setUsageFilter,
    setVisibleEntities,
    setStorageType,
    setUptimeFilter,
    setNodesSortParams,
    setGroupsSortParams,
} = slice.actions;

export const storageApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getStorageNodesInfo: builder.query({
            queryFn: async (params: Omit<NodesApiRequestParams, 'type'>, {signal}) => {
                try {
                    const result = await window.api.getNodes(
                        {storage: true, type: 'static', ...params},
                        {signal},
                    );
                    return {data: prepareStorageNodesResponse(result)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getStorageGroupsInfo: builder.query({
            queryFn: async (params: StorageApiRequestParams, {signal}) => {
                try {
                    const result = await window.api.getStorageInfo(
                        {version: EVersion.v1, ...params},
                        {signal},
                    );
                    return {data: prepareStorageGroupsResponse(result)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
