import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {ETabletState, EType} from '../../types/api/tablet';
import type {TabletsApiRequestParams, TabletsState} from '../../types/store/tablets';

import {api} from './api';

const initialState: TabletsState = {
    stateFilter: [],
    typeFilter: [],
};

const slice = createSlice({
    name: 'tablets',
    initialState,
    reducers: {
        setStateFilter: (state, action: PayloadAction<ETabletState[]>) => {
            state.stateFilter = action.payload;
        },
        setTypeFilter: (state, action: PayloadAction<EType[]>) => {
            state.typeFilter = action.payload;
        },
    },
});

export const {setStateFilter, setTypeFilter} = slice.actions;
export default slice.reducer;

export const tabletsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTabletsInfo: build.query({
            queryFn: async (params: TabletsApiRequestParams, {signal}) => {
                try {
                    const data = await window.api.getTabletsInfo(params, {signal});
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
