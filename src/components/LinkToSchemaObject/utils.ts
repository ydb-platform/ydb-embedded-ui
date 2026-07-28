import {TenantTabsGroups} from '../../containers/Tenant/TenantPages';
import {getTenantPageForDiagnosticsTab} from '../../containers/Tenant/utils/diagnosticsNavigation';
import {TENANT_DIAGNOSTICS_TABS_IDS, TENANT_PAGES_IDS} from '../../store/reducers/tenant/constants';
import type {TenantDiagnosticsTab} from '../../store/reducers/tenant/types';

type SchemaObjectLinkQueryParams = Record<string, unknown>;

function isTenantDiagnosticsTab(value: unknown): value is TenantDiagnosticsTab {
    return (
        typeof value === 'string' &&
        Object.values(TENANT_DIAGNOSTICS_TABS_IDS).includes(value as TenantDiagnosticsTab)
    );
}

export function getSchemaObjectLinkDiagnosticsTab(
    queryParams: SchemaObjectLinkQueryParams,
    isV2NavigationEnabled: boolean,
): TenantDiagnosticsTab | undefined {
    const diagnosticsTab = queryParams[TenantTabsGroups.diagnosticsTab];

    if (!isTenantDiagnosticsTab(diagnosticsTab)) {
        return isV2NavigationEnabled ? TENANT_DIAGNOSTICS_TABS_IDS.overview : undefined;
    }

    if (
        getTenantPageForDiagnosticsTab(diagnosticsTab, isV2NavigationEnabled) ===
        TENANT_PAGES_IDS.database
    ) {
        return TENANT_DIAGNOSTICS_TABS_IDS.overview;
    }

    return diagnosticsTab;
}
