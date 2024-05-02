import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {EVersion} from '../../../types/api/compute';
import {NodesUptimeFilterValues} from '../../../utils/nodes';
import {api} from '../api';

import type {
    ComputeApiRequestParams,
    NodesApiRequestParams,
    NodesSortParams,
    NodesState,
} from './types';
import {prepareComputeNodesData, prepareNodesData} from './utils';

const initialState: NodesState = {
    uptimeFilter: NodesUptimeFilterValues.All,
    searchValue: '',
};

const slice = createSlice({
    name: 'nodes',
    initialState,
    reducers: {
        setUptimeFilter: (state, action: PayloadAction<NodesUptimeFilterValues>) => {
            state.uptimeFilter = action.payload;
        },
        setSearchValue: (state, action: PayloadAction<string>) => {
            state.searchValue = action.payload;
        },
        setSort: (state, action: PayloadAction<NodesSortParams>) => {
            state.sortValue = action.payload.sortValue;
            state.sortOrder = action.payload.sortOrder;
        },
        setInitialState: () => {
            return initialState;
        },
    },
});

export default slice.reducer;

export const {setUptimeFilter, setSearchValue, setSort, setInitialState} = slice.actions;

export const nodesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getNodes: builder.query({
            queryFn: async (params: NodesApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getNodes(
                        {
                            type: 'any',
                            storage: false,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareNodesData(data)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getComputeNodes: builder.query({
            queryFn: async (params: ComputeApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getCompute(
                        {
                            version: EVersion.v2,
                            ...params,
                        },
                        {signal},
                    );
                    return {data: prepareComputeNodesData(data)};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
});
