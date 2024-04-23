import type {ValueOf} from '../../../types/common';

import type {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_METRICS_TABS_IDS,
    TENANT_PAGES_IDS,
    TENANT_QUERY_TABS_ID,
    TENANT_SUMMARY_TABS_IDS,
} from './constants';

export type TenantPage = ValueOf<typeof TENANT_PAGES_IDS>;

export type TenantQueryTab = ValueOf<typeof TENANT_QUERY_TABS_ID>;
export type TenantDiagnosticsTab = ValueOf<typeof TENANT_DIAGNOSTICS_TABS_IDS>;
export type TenantSummaryTab = ValueOf<typeof TENANT_SUMMARY_TABS_IDS>;
export type TenantMetricsTab = ValueOf<typeof TENANT_METRICS_TABS_IDS>;

export interface TenantState {
    tenantPage?: TenantPage;
    queryTab?: TenantQueryTab;
    diagnosticsTab?: TenantDiagnosticsTab;
    summaryTab?: TenantSummaryTab;
    metricsTab?: TenantMetricsTab;
}
