import React from 'react';

import {
    useConfigAvailable,
    useNewStorageViewEnabled,
    useStorageStatsAvailable,
    useTopicDataAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {TENANT_DIAGNOSTICS_TABS_IDS} from '../../../store/reducers/tenant/constants';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {TenantDiagnosticsTab} from '../../../store/reducers/tenant/types';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useIsViewerUser, useUserPermissions} from '../../../utils/hooks/useWhoami';
import {
    canShowTenantBackupsTab,
    canShowTenantMonitoringTab,
} from '../../../utils/monitoringVisibility';
import {useControlPlaneOperationsAvailable} from '../../Operations/useOperationsSource';
import {useDatabaseRuntimeState} from '../DatabaseAvailability/useDatabaseAvailability';
import {isDatabaseEntityType} from '../utils/schema';

import {getPagesByType} from './DiagnosticsPages';
import type {DatabasePagesDisplay, Page} from './DiagnosticsPages';

const CONTROL_PLANE_TABS = new Set<TenantDiagnosticsTab>([
    TENANT_DIAGNOSTICS_TABS_IDS.database,
    TENANT_DIAGNOSTICS_TABS_IDS.monitoring,
    TENANT_DIAGNOSTICS_TABS_IDS.operations,
    TENANT_DIAGNOSTICS_TABS_IDS.backups,
]);

export interface UseDiagnosticsPagesParams {
    path: string;
    database: string;
    databaseFullPath: string;
    type?: EPathType;
    subType?: EPathSubType;
    databasePagesDisplay?: DatabasePagesDisplay;
}

export function useDiagnosticsPages({
    path,
    database,
    databaseFullPath,
    type,
    subType,
    databasePagesDisplay,
}: UseDiagnosticsPagesParams): Page[] {
    const isDatabase = isDatabaseEntityType(type) || path === databaseFullPath;

    const {controlPlane, databaseType, metaErrors} = useTenantBaseInfo(isDatabase ? database : '');
    const controlPlaneError = metaErrors?.control_plane;
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();

    const hasConfigs = useConfigAvailable();
    const newStorageViewEnabled = useNewStorageViewEnabled();
    const storageStatsAvailable = useStorageStatsAvailable();
    const hasStorageUsage = newStorageViewEnabled && storageStatsAvailable;
    const hasTopicData = useTopicDataAvailable();
    const isViewerUser = useIsViewerUser();
    const userPermissions = useUserPermissions();

    const {coldStart} = useDatabaseRuntimeState();
    const hasControlPlaneOperations = useControlPlaneOperationsAvailable(database);

    return React.useMemo(() => {
        const pages = getPagesByType(type, subType, {
            hasTopicData,
            isDatabase,
            hasStorageUsage,
            hasBackups: canShowTenantBackupsTab(controlPlane, controlPlaneError),
            hasConfigs: isViewerUser && hasConfigs,
            hasAccess: uiFactory.hasAccess({userPermissions}),
            hasMonitoring: canShowTenantMonitoringTab(controlPlane, clusterMonitoring),
            databaseType,
            databasePagesDisplay,
        });
        if (!coldStart) {
            return pages;
        }
        // The runtime has not responded yet: keep only the tabs served by the control plane
        return pages.filter(
            (page) =>
                CONTROL_PLANE_TABS.has(page.id) &&
                (page.id !== TENANT_DIAGNOSTICS_TABS_IDS.operations || hasControlPlaneOperations),
        );
    }, [
        coldStart,
        hasControlPlaneOperations,
        type,
        subType,
        hasTopicData,
        isDatabase,
        hasStorageUsage,
        controlPlane,
        controlPlaneError,
        isViewerUser,
        hasConfigs,
        clusterMonitoring,
        databaseType,
        databasePagesDisplay,
        userPermissions,
    ]);
}
