import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {DEFAULT_USER_SETTINGS, settingsManager} from '../../../services/settings';
import type {TTenantInfo} from '../../../types/api/tenant';
import {TENANT_INITIAL_PAGE_KEY} from '../../../utils/constants';
import {api} from '../api';

import {tenantPageSchema} from './types';
import type {
    TenantDiagnosticsTab,
    TenantMetricsTab,
    TenantPage,
    TenantQueryTab,
    TenantState,
    TenantSummaryTab,
} from './types';

const tenantPage = tenantPageSchema
    .catch(DEFAULT_USER_SETTINGS[TENANT_INITIAL_PAGE_KEY])
    .parse(settingsManager.readUserSettingsValue(TENANT_INITIAL_PAGE_KEY));

const initialState: TenantState = {
    tenantPage,
};

const slice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        setTenantPage: (state, action: PayloadAction<TenantPage>) => {
            state.tenantPage = action.payload;
        },
        setQueryTab: (state, action: PayloadAction<TenantQueryTab>) => {
            state.queryTab = action.payload;
        },
        setDiagnosticsTab: (state, action: PayloadAction<TenantDiagnosticsTab>) => {
            state.diagnosticsTab = action.payload;
        },
        setSummaryTab: (state, action: PayloadAction<TenantSummaryTab>) => {
            state.summaryTab = action.payload;
        },
        setMetricsTab: (state, action: PayloadAction<TenantMetricsTab>) => {
            state.metricsTab = action.payload;
        },
    },
});

export default slice.reducer;
export const {setTenantPage, setQueryTab, setDiagnosticsTab, setSummaryTab, setMetricsTab} =
    slice.actions;

export const tenantApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTenantInfo: builder.query({
            queryFn: async (
                {path, clusterName}: {path: string; clusterName?: string},
                {signal},
            ) => {
                try {
                    let tenantData: TTenantInfo;
                    if (window.api.meta && clusterName) {
                        tenantData = await window.api.meta.getTenants(
                            {databaseName: path, clusterName},
                            {signal},
                        );
                    } else {
                        tenantData = await window.api.viewer.getTenantInfo({path}, {signal});
                    }
                    const databases = tenantData.TenantInfo || [];
                    // previous meta versions do not support filtering databases by name
                    const data =
                        databases.find((tenant) => tenant.Name === path) ?? databases[0] ?? null;
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getClusterConfig: builder.query({
            queryFn: async ({database}: {database: string}, {signal}) => {
                try {
                    const res = await window.api.viewer.getClusterConfig(database, {signal});
                    const db = res.Databases[0];

                    return {data: db.FeatureFlags};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});
