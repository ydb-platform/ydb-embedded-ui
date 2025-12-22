import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TTenantInfo} from '../../../types/api/tenant';
import {useClusterNameFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../../utils/hooks/useDatabasesV2';
import {api} from '../api';
import {prepareTenants} from '../tenants/utils';

import {TENANT_DIAGNOSTICS_TABS_IDS, TENANT_METRICS_TABS_IDS} from './constants';
import type {
    TenantDiagnosticsTab,
    TenantMetricsTab,
    TenantQueryTab,
    TenantState,
    TenantSummaryTab,
} from './types';

export const initialState: TenantState = {
    metricsTab: TENANT_METRICS_TABS_IDS.cpu,
    diagnosticsTab: TENANT_DIAGNOSTICS_TABS_IDS.overview,
};

const slice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
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
            // Ensure we always have a valid metrics tab - fallback to CPU if empty/invalid
            const validTabs = Object.values(TENANT_METRICS_TABS_IDS) as TenantMetricsTab[];
            const isValidTab = action.payload && validTabs.includes(action.payload);
            state.metricsTab = isValidTab ? action.payload : TENANT_METRICS_TABS_IDS.cpu;
        },
    },
});

export default slice.reducer;
export const {setQueryTab, setDiagnosticsTab, setSummaryTab, setMetricsTab} = slice.actions;

export const tenantApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getTenantInfo: builder.query({
            queryFn: async (
                {
                    database,
                    clusterName,
                    isMetaDatabasesAvailable,
                }: {
                    database: string;
                    clusterName?: string;
                    isMetaDatabasesAvailable: boolean;
                },
                {signal},
            ) => {
                try {
                    let tenantData: TTenantInfo;
                    if (window.api.meta && clusterName && isMetaDatabasesAvailable) {
                        tenantData = await window.api.meta.getTenantsV2(
                            {database, clusterName},
                            {signal},
                        );
                    } else if (window.api.meta && clusterName) {
                        tenantData = await window.api.meta.getTenants(
                            {database, clusterName},
                            {signal},
                        );
                    } else {
                        tenantData = await window.api.viewer.getTenantInfo({database}, {signal});
                    }
                    const databases = prepareTenants(tenantData.TenantInfo || []);
                    // previous meta versions do not support filtering databases by name
                    const data =
                        databases.find(
                            (tenant) => tenant.Name === database || tenant.Id === database,
                        ) ??
                        databases[0] ??
                        null;
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
            serializeQueryArgs: ({queryArgs}) => {
                const {clusterName, database} = queryArgs;
                return {clusterName, database};
            },
        }),
    }),
    overrideExisting: 'throw',
});

export function useTenantBaseInfo(database: string) {
    const clusterNameFromQuery = useClusterNameFromQuery();
    const isMetaDatabasesAvailable = useDatabasesV2();

    const {currentData, isLoading, isError} = tenantApi.useGetTenantInfoQuery(
        {
            database,
            clusterName: clusterNameFromQuery,
            isMetaDatabasesAvailable,
        },
        {skip: !database},
    );

    const {ControlPlane, Name, Id, Type} = currentData || {};

    return {
        controlPlane: ControlPlane,
        name: Name,
        id: Id,
        databaseType: Type,
        isLoading,
        isError,
    };
}
