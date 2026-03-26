import {renderHook} from '@testing-library/react';

import {
    useCapabilitiesLoaded,
    useConfigAvailable,
    useNewStorageViewEnabled,
    useStorageGroupsHandlerAvailable,
    useStorageStatsAvailable,
    useTopicDataAvailable,
} from '../../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {useTenantBaseInfo} from '../../../../store/reducers/tenant/tenant';
import {EPathType} from '../../../../types/api/schema';
import {useIsViewerUser} from '../../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoringTab} from '../../../../utils/monitoringVisibility';
import {useDiagnosticsPages} from '../useDiagnosticsPages';

jest.mock('../../../../store/reducers/capabilities/hooks', () => ({
    useCapabilitiesLoaded: jest.fn(),
    useConfigAvailable: jest.fn(),
    useNewStorageViewEnabled: jest.fn(),
    useStorageGroupsHandlerAvailable: jest.fn(),
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

jest.mock('../../../../utils/hooks/useIsUserAllowedToMakeChanges', () => ({
    useIsViewerUser: jest.fn(),
}));

jest.mock('../../../../utils/monitoringVisibility', () => ({
    canShowTenantMonitoringTab: jest.fn(),
}));

describe('useDiagnosticsPages', () => {
    beforeEach(() => {
        (useCapabilitiesLoaded as jest.Mock).mockReturnValue(true);
        (useConfigAvailable as jest.Mock).mockReturnValue(true);
        (useNewStorageViewEnabled as jest.Mock).mockReturnValue(true);
        (useStorageGroupsHandlerAvailable as jest.Mock).mockReturnValue(true);
        (useStorageStatsAvailable as jest.Mock).mockReturnValue(true);
        (useTopicDataAvailable as jest.Mock).mockReturnValue(true);
        (useClusterBaseInfo as jest.Mock).mockReturnValue({monitoring: {}});
        (useTenantBaseInfo as jest.Mock).mockReturnValue({
            controlPlane: true,
            databaseType: undefined,
        });
        (useIsViewerUser as jest.Mock).mockReturnValue(true);
        (canShowTenantMonitoringTab as jest.Mock).mockReturnValue(true);
    });

    test('hides storage usage tab when storage stats capability is unavailable', () => {
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
