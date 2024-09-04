import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import {DEFAULT_USER_SETTINGS, settingsManager} from '../../../services/settings';
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
        setFeatureFlagsFilter: (state, action: PayloadAction<string>) => {
            state.featureFlagsFilter = action.payload;
        },
    },
});

export default slice.reducer;
export const {
    setTenantPage,
    setQueryTab,
    setDiagnosticsTab,
    setSummaryTab,
    setMetricsTab,
    setFeatureFlagsFilter,
} = slice.actions;

export const tenantApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTenantInfo: builder.query({
            queryFn: async ({path}: {path: string}, {signal}) => {
                try {
                    const tenantData = await window.api.getTenantInfo({path}, {signal});
                    return {data: tenantData.TenantInfo?.[0] ?? null};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
        getClusterConfig: builder.query({
            queryFn: async ({database}: {database?: string}, {signal}) => {
                try {
                    // FIXME: pass database param when supported, remove filter
                    const res = await window.api.getClusterConfig(undefined, {signal});
                    const db = res.Databases.filter((item) => item.Name === database)[0];

                    return {data: db.FeatureFlags};
                } catch (error) {
                    return {error};
                }
            },
        }),
    }),
    overrideExisting: 'throw',
});
