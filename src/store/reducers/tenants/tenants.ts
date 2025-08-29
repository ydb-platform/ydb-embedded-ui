import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TTenantInfo} from '../../../types/api/tenant';
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
            queryFn: async (
                {
                    clusterName,
                    isMetaDatabasesAvailable,
                }: {clusterName?: string; isMetaDatabasesAvailable?: boolean},
                {signal},
            ) => {
                try {
                    let response: TTenantInfo;

                    if (isMetaDatabasesAvailable && window.api.meta) {
                        response = await window.api.meta.getTenantsV2({clusterName}, {signal});
                    } else if (window.api.meta) {
                        response = await window.api.meta.getTenants({clusterName}, {signal});
                    } else {
                        response = await window.api.viewer.getTenants({clusterName}, {signal});
                    }
                    let data: PreparedTenant[];
                    if (Array.isArray(response.TenantInfo)) {
                        data = prepareTenants(response.TenantInfo);
                    } else {
                        data = [];
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {clusterName} = queryArgs;
                return {clusterName};
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
