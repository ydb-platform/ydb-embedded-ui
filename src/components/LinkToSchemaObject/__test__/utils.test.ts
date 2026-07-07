import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_PAGE,
    TENANT_PAGES_IDS,
} from '../../../store/reducers/tenant/constants';
import {getSchemaObjectLinkDiagnosticsTab} from '../utils';

describe('getSchemaObjectLinkDiagnosticsTab', () => {
    test('keeps current diagnostics tab for navigation v1', () => {
        const query = {
            database: '/Root/db',
            [TENANT_PAGE]: TENANT_PAGES_IDS.database,
            diagnosticsTab: TENANT_DIAGNOSTICS_TABS_IDS.storage,
        };

        expect(getSchemaObjectLinkDiagnosticsTab(query, false)).toBe(
            TENANT_DIAGNOSTICS_TABS_IDS.storage,
        );
    });

    test('resets v2 database page tabs to diagnostics overview', () => {
        const query = {
            database: '/Root/db',
            [TENANT_PAGE]: TENANT_PAGES_IDS.database,
            diagnosticsTab: TENANT_DIAGNOSTICS_TABS_IDS.storage,
        };

        expect(getSchemaObjectLinkDiagnosticsTab(query, true)).toBe(
            TENANT_DIAGNOSTICS_TABS_IDS.overview,
        );
    });

    test('preserves diagnostics page tab for navigation v2 object links', () => {
        const query = {
            database: '/Root/db',
            [TENANT_PAGE]: TENANT_PAGES_IDS.diagnostics,
            diagnosticsTab: TENANT_DIAGNOSTICS_TABS_IDS.topShards,
        };

        expect(getSchemaObjectLinkDiagnosticsTab(query, true)).toBe(
            TENANT_DIAGNOSTICS_TABS_IDS.topShards,
        );
    });

    test('resets invalid diagnostics tab for navigation v2 object links', () => {
        expect(getSchemaObjectLinkDiagnosticsTab({diagnosticsTab: 'unknown'}, true)).toBe(
            TENANT_DIAGNOSTICS_TABS_IDS.overview,
        );
    });
});
