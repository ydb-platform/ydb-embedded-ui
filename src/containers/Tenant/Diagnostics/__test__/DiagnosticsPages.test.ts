import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {EPathType} from '../../../../types/api/schema';
import {getPagesByType} from '../DiagnosticsPages';

const BASE_OPTIONS = {
    hasTopicData: true,
    hasBackups: true,
    hasConfigs: true,
    hasAccess: true,
    hasMonitoring: true,
};

describe('DiagnosticsPages', () => {
    test('hides storage usage tab for table pages when storage groups handler is unavailable', () => {
        const pages = getPagesByType(EPathType.EPathTypeTable, undefined, {
            ...BASE_OPTIONS,
            hasStorageUsage: false,
        });

        expect(pages.map((page) => page.id)).not.toContain(
            TENANT_DIAGNOSTICS_TABS_IDS.storageUsage,
        );
    });

    test('shows storage usage tab for table pages when storage groups handler is available', () => {
        const pages = getPagesByType(EPathType.EPathTypeTable, undefined, {
            ...BASE_OPTIONS,
            hasStorageUsage: true,
        });

        expect(pages.map((page) => page.id)).toContain(TENANT_DIAGNOSTICS_TABS_IDS.storageUsage);
    });

    test('hides storage usage tab for column table pages when storage groups handler is unavailable', () => {
        const pages = getPagesByType(EPathType.EPathTypeColumnTable, undefined, {
            ...BASE_OPTIONS,
            hasStorageUsage: false,
        });

        expect(pages.map((page) => page.id)).not.toContain(
            TENANT_DIAGNOSTICS_TABS_IDS.storageUsage,
        );
    });

    test('shows backups tab for serverless databases when backups are available', () => {
        const pages = getPagesByType(EPathType.EPathTypeExtSubDomain, undefined, {
            ...BASE_OPTIONS,
            isDatabase: true,
            databaseType: 'Serverless',
        });

        expect(pages.map((page) => page.id)).toContain(TENANT_DIAGNOSTICS_TABS_IDS.backups);
    });

    test('hides backups tab for serverless databases when backups are unavailable', () => {
        const pages = getPagesByType(EPathType.EPathTypeExtSubDomain, undefined, {
            ...BASE_OPTIONS,
            hasBackups: false,
            isDatabase: true,
            databaseType: 'Serverless',
        });

        expect(pages.map((page) => page.id)).not.toContain(TENANT_DIAGNOSTICS_TABS_IDS.backups);
    });

    test('shows backups tab for serverless databases in database pages display mode', () => {
        const pages = getPagesByType(EPathType.EPathTypeExtSubDomain, undefined, {
            ...BASE_OPTIONS,
            isDatabase: true,
            databaseType: 'Serverless',
            databasePagesDisplay: 'database',
        });

        expect(pages.map((page) => page.id)).toContain(TENANT_DIAGNOSTICS_TABS_IDS.backups);
    });
});
