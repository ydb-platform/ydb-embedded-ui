import {z} from 'zod';

import type {ValueOf} from '../../../types/common';

import {TENANT_PAGES_IDS, TENANT_STORAGE_TABS_IDS} from './constants';
import type {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_METRICS_TABS_IDS,
    TENANT_NETWORK_TABS_IDS,
    TENANT_QUERY_TABS_ID,
    TENANT_SUMMARY_TABS_IDS,
} from './constants';

export const tenantPageSchema = z.nativeEnum(TENANT_PAGES_IDS);
export type TenantPage = z.infer<typeof tenantPageSchema>;

export const tenantStorageTabSchema = z
    .nativeEnum(TENANT_STORAGE_TABS_IDS)
    .catch(TENANT_STORAGE_TABS_IDS.tables);

export type TenantQueryTab = ValueOf<typeof TENANT_QUERY_TABS_ID>;
export type TenantDiagnosticsTab = ValueOf<typeof TENANT_DIAGNOSTICS_TABS_IDS>;
export type TenantSummaryTab = ValueOf<typeof TENANT_SUMMARY_TABS_IDS>;
export type TenantMetricsTab = ValueOf<typeof TENANT_METRICS_TABS_IDS>;

export type TenantStorageTab = ValueOf<typeof TENANT_STORAGE_TABS_IDS>;
export type TenantNetworkTab = ValueOf<typeof TENANT_NETWORK_TABS_IDS>;

export interface TenantState {
    tenantPage: TenantPage;
    queryTab?: TenantQueryTab;
    diagnosticsTab?: TenantDiagnosticsTab;
    summaryTab?: TenantSummaryTab;
    metricsTab: TenantMetricsTab;
}
