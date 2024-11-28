import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {api} from '../api';

import type {ClustersFilters} from './types';
import {prepareClustersData} from './utils';

const initialState: ClustersFilters = {
    clusterName: '',
    status: [],
    service: [],
    version: [],
};

const slice = createSlice({
    name: 'clusters',
    initialState,
    reducers: {
        changeClustersFilters: (state, action: PayloadAction<Partial<ClustersFilters>>) => ({
            ...state,
            ...action.payload,
        }),
    },
});

export default slice.reducer;
export const {changeClustersFilters} = slice.actions;

export const clustersApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getClustersList: builder.query({
            queryFn: async (_, {signal}) => {
                try {
                    if (window.api.meta) {
                        const data = await window.api.meta.getClustersList(undefined, {signal});
                        return {data: prepareClustersData(data)};
                    } else {
                        throw new Error('Method is not implemented.');
                    }
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
