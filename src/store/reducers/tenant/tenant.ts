import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';

import type {TTenantInfo} from '../../../types/api/tenant';
import {useClusterNameFromQuery} from '../../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../../utils/hooks/useDatabasesV2';
import {api} from '../api';
import {getDatabaseDataTag} from '../entityDataTags';
import {prepareTenants} from '../tenants/utils';

import {matchesDatabase} from './availability';
import type {TenantInfo} from './availability';
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
        getTenantInfo: builder.query<
            TenantInfo,
            {
                database: string;
                clusterName?: string;
                isMetaDatabasesAvailable: boolean;
            }
        >({
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
                    const tenants = tenantData.TenantInfo || [];
                    const matchingTenant = tenants.find((tenant) =>
                        matchesDatabase(tenant, database),
                    );
                    // Preserve legacy healthy filtering behavior, but never select another database's CP data.
                    const viewerUnavailable = Boolean(tenantData.sourceErrors?.viewer);
                    const tenant = matchingTenant ?? (viewerUnavailable ? undefined : tenants[0]);
                    if (!tenant) {
                        return {error: {code: 'EMPTY_TENANT_INFO'}};
                    }
                    if (viewerUnavailable) {
                        return {
                            data: {
                                ...tenant,
                                availability: 'control-plane',
                                sourceErrors: tenantData.sourceErrors,
                            },
                        };
                    }
                    const data: TenantInfo = {
                        ...prepareTenants(tenants)[tenants.indexOf(tenant)],
                        availability: 'runtime',
                        sourceErrors: tenantData.sourceErrors,
                    };
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: (result, _error, {clusterName, database}) => {
                const databaseAliases = new Set([database]);
                if (result?.Id) {
                    databaseAliases.add(result.Id);
                }
                if (result?.Name) {
                    databaseAliases.add(result.Name);
                }

                return [
                    'All' as const,
                    ...Array.from(databaseAliases, (databaseAlias) =>
                        getDatabaseDataTag({clusterName, database: databaseAlias}),
                    ),
                ];
            },
            serializeQueryArgs: ({queryArgs}) => {
                const {clusterName, database, isMetaDatabasesAvailable} = queryArgs;
                return {clusterName, database, isMetaDatabasesAvailable};
            },
        }),
    }),
    overrideExisting: 'throw',
});

export function useTenantBaseInfo(
    database: string,
    clusterNameOverride?: string,
    {skip = false}: {skip?: boolean} = {},
) {
    const clusterNameFromQuery = useClusterNameFromQuery();
    const clusterName = clusterNameOverride ?? clusterNameFromQuery;
    const isMetaDatabasesAvailable = useDatabasesV2();

    const {currentData, isLoading, isError, error, refetch} = tenantApi.useGetTenantInfoQuery(
        {
            database,
            clusterName,
            isMetaDatabasesAvailable,
        },
        {skip: skip || !database},
    );

    const {ControlPlane, Name, Id, Type} = currentData || {};

    return {
        databaseData: currentData,
        refetch,
        controlPlane: ControlPlane,
        name: Name,
        id: Id,
        databaseType: Type,
        isLoading,
        isError,
        error,
    };
}
