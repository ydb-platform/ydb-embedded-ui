import {z} from 'zod';

import type {ValueOf} from '../../../types/common';

import {TENANT_PAGES_IDS} from './constants';
import type {
    TENANT_CPU_NODES_MODE_IDS,
    TENANT_CPU_TABS_IDS,
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_METRICS_TABS_IDS,
    TENANT_NETWORK_TABS_IDS,
    TENANT_QUERY_TABS_ID,
    TENANT_STORAGE_TABS_IDS,
    TENANT_SUMMARY_TABS_IDS,
} from './constants';

export const tenantPageSchema = z.nativeEnum(TENANT_PAGES_IDS);
export type TenantPage = z.infer<typeof tenantPageSchema>;

export type TenantQueryTab = ValueOf<typeof TENANT_QUERY_TABS_ID>;
export type TenantDiagnosticsTab = ValueOf<typeof TENANT_DIAGNOSTICS_TABS_IDS>;
export type TenantSummaryTab = ValueOf<typeof TENANT_SUMMARY_TABS_IDS>;
export type TenantMetricsTab = ValueOf<typeof TENANT_METRICS_TABS_IDS>;
export type TenantCpuTab = ValueOf<typeof TENANT_CPU_TABS_IDS>;
export type TenantNodesMode = ValueOf<typeof TENANT_CPU_NODES_MODE_IDS>;
export type TenantStorageTab = ValueOf<typeof TENANT_STORAGE_TABS_IDS>;
export type TenantNetworkTab = ValueOf<typeof TENANT_NETWORK_TABS_IDS>;

export interface TenantState {
    tenantPage: TenantPage;
    queryTab?: TenantQueryTab;
    diagnosticsTab?: TenantDiagnosticsTab;
    summaryTab?: TenantSummaryTab;
    metricsTab: TenantMetricsTab;
}
