import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {RootState} from '../../defaultStore';
import {api} from '../api';

import type {PreparedTenant, TenantsState} from './types';
import {prepareTenants} from './utils';

const initialState: TenantsState = {searchValue: ''};

const slice = createSlice({
    name: 'tenants',
    initialState,
    reducers: {
        setSearchValue: (state, action: PayloadAction<string>) => {
            state.searchValue = action.payload;
        },
    },
});

export const {setSearchValue} = slice.actions;
export default slice.reducer;

export const tenantsApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTenantsInfo: build.query({
            queryFn: async ({clusterName}: {clusterName?: string}, {signal, getState}) => {
                try {
                    const response = await window.api.getTenants(clusterName, {signal});
                    let data: PreparedTenant[];
                    if (Array.isArray(response.TenantInfo)) {
                        const {singleClusterMode} = getState() as RootState;
                        data = prepareTenants(response.TenantInfo, singleClusterMode);
                    } else {
                        data = [];
                    }
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
