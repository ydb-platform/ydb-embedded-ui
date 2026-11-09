import {renderHook} from '@testing-library/react';

import {
    useCapabilitiesLoaded,
    useConfigAvailable,
    useNewStorageViewEnabled,
    useStorageStatsAvailable,
    useTopicDataAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {useTenantBaseInfo} from '../../../../store/reducers/tenant/tenant';
import {EPathType} from '../../../../types/api/schema';
import {configureUIFactory, uiFactory} from '../../../../uiFactory/uiFactory';
import {useIsViewerUser, useUserPermissions} from '../../../../utils/hooks/useWhoami';
import {canShowTenantMonitoringTab} from '../../../../utils/monitoringVisibility';
import {useDiagnosticsPages} from '../useDiagnosticsPages';

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useCapabilitiesLoaded: jest.fn(),
    useConfigAvailable: jest.fn(),
    useNewStorageViewEnabled: jest.fn(),
    useStorageStatsAvailable: jest.fn(),
    useTopicDataAvailable: jest.fn(),
}));

jest.mock('../../../../store/reducers/cluster/cluster', () => ({
    useClusterBaseInfo: jest.fn(),
}));

jest.mock('../../../../store/reducers/tenant/tenant', () => {
    const actual = jest.requireActual('../../../../store/reducers/tenant/tenant');

    return {
        ...actual,
        useTenantBaseInfo: jest.fn(),
    };
});

jest.mock('../../../../utils/hooks/useWhoami', () => ({
    useIsViewerUser: jest.fn(),
    useUserPermissions: jest.fn(),
}));

jest.mock('../../../../utils/monitoringVisibility', () => ({
    canShowTenantMonitoringTab: jest.fn(),
}));

describe('useDiagnosticsPages', () => {
    const originalRenderBackups = uiFactory.renderBackups;

    afterEach(() => {
        configureUIFactory({renderBackups: originalRenderBackups});
    });

    beforeEach(() => {
        jest.clearAllMocks();

        (useCapabilitiesLoaded as jest.Mock).mockReturnValue(true);
        (useConfigAvailable as jest.Mock).mockReturnValue(true);
        (useNewStorageViewEnabled as jest.Mock).mockReturnValue(true);
        (useStorageStatsAvailable as jest.Mock).mockReturnValue(true);
        (useTopicDataAvailable as jest.Mock).mockReturnValue(true);
        (useClusterBaseInfo as jest.Mock).mockReturnValue({monitoring: {}});
        (useTenantBaseInfo as jest.Mock).mockReturnValue({
            controlPlane: true,
            databaseType: undefined,
        });
        (useIsViewerUser as jest.Mock).mockReturnValue(true);
        (canShowTenantMonitoringTab as jest.Mock).mockReturnValue(true);
        (useUserPermissions as jest.Mock).mockReturnValue(undefined);
    });

    test.each(['Dedicated', 'Serverless'] as const)(
        'updates backups visibility when a control plane error changes for a %s database',
        (databaseType) => {
            configureUIFactory({renderBackups: () => null});
            (useTenantBaseInfo as jest.Mock).mockReturnValue({databaseType});
            const {result, rerender} = renderHook(() =>
                useDiagnosticsPages({
                    path: '/local',
                    database: '/local',
                    databaseFullPath: '/local',
                    type: EPathType.EPathTypeSubDomain,
                }),
            );
            expect(result.current.map((page) => page.id)).not.toContain(
                TENANT_DIAGNOSTICS_TABS_IDS.backups,
            );

            (useTenantBaseInfo as jest.Mock).mockReturnValue({
                databaseType,
                metaErrors: {control_plane: 'Control plane unavailable'},
            });
            rerender();
            expect(result.current.map((page) => page.id)).toContain(
                TENANT_DIAGNOSTICS_TABS_IDS.backups,
            );

            (useTenantBaseInfo as jest.Mock).mockReturnValue({
                databaseType,
                metaErrors: {viewer: 'Viewer unavailable'},
            });
            rerender();
            expect(result.current.map((page) => page.id)).not.toContain(
                TENANT_DIAGNOSTICS_TABS_IDS.backups,
            );
        },
    );

    test('hides backups without a renderer even when control plane has failed', () => {
        configureUIFactory({renderBackups: undefined});
        (useTenantBaseInfo as jest.Mock).mockReturnValue({
            metaErrors: {control_plane: 'Control plane unavailable'},
        });
        const {result} = renderHook(() =>
            useDiagnosticsPages({
                path: '/local',
                database: '/local',
                databaseFullPath: '/local',
                type: EPathType.EPathTypeSubDomain,
            }),
        );

        expect(result.current.map((page) => page.id)).not.toContain(
            TENANT_DIAGNOSTICS_TABS_IDS.backups,
        );
    });

    test('hides storage usage tab when storage stats capability is unavailable', () => {
        (useCapabilitiesLoaded as jest.Mock).mockReturnValue(false);
        (useStorageStatsAvailable as jest.Mock).mockReturnValue(false);

        const {result} = renderHook(() =>
            useDiagnosticsPages({
                path: '/local/table',
                database: '/local',
                databaseFullPath: '/local',
                type: EPathType.EPathTypeTable,
            }),
        );

        expect(result.current.map((page) => page.id)).not.toContain(
            TENANT_DIAGNOSTICS_TABS_IDS.storageUsage,
        );
    });

    test('hides storage usage tab when new storage view experiment is disabled', () => {
        (useNewStorageViewEnabled as jest.Mock).mockReturnValue(false);

        const {result} = renderHook(() =>
            useDiagnosticsPages({
                path: '/local/table',
                database: '/local',
                databaseFullPath: '/local',
                type: EPathType.EPathTypeTable,
            }),
        );

        expect(result.current.map((page) => page.id)).not.toContain(
            TENANT_DIAGNOSTICS_TABS_IDS.storageUsage,
        );
    });
});
