import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGES_IDS,
} from '../../../store/reducers/tenant/constants';
import type {TenantDiagnosticsTab, TenantPage} from '../../../store/reducers/tenant/types';

// In tenant navigation v2 database diagnostics tabs are split between two top-level pages.
// Route each tab to the page that renders it; otherwise Diagnostics falls back to the
// first available tab and actions like "Monitoring" appear to do nothing.
// These tabs live under databasePage=database; the rest stay under databasePage=diagnostics.
export const V2_DATABASE_PAGE_DIAGNOSTICS_TABS = [
    TENANT_DIAGNOSTICS_TABS_IDS.database,
    TENANT_DIAGNOSTICS_TABS_IDS.monitoring,
    TENANT_DIAGNOSTICS_TABS_IDS.topQueries,
    TENANT_DIAGNOSTICS_TABS_IDS.storage,
    TENANT_DIAGNOSTICS_TABS_IDS.network,
    TENANT_DIAGNOSTICS_TABS_IDS.configs,
    TENANT_DIAGNOSTICS_TABS_IDS.operations,
    TENANT_DIAGNOSTICS_TABS_IDS.backups,
] as const satisfies readonly TenantDiagnosticsTab[];

const V2_DATABASE_PAGE_TABS = new Set<TenantDiagnosticsTab>(V2_DATABASE_PAGE_DIAGNOSTICS_TABS);

export function getTenantPageForDiagnosticsTab(
    tab: TenantDiagnosticsTab,
    isV2Enabled: boolean,
): TenantPage {
    if (!isV2Enabled) {
        return TENANT_PAGES_IDS.diagnostics;
    }
    return V2_DATABASE_PAGE_TABS.has(tab)
        ? TENANT_PAGES_IDS.database
        : TENANT_PAGES_IDS.diagnostics;
}
