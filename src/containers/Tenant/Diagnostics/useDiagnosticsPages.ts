import React from 'react';

import {
    useCapabilitiesLoaded,
    useConfigAvailable,
    useNewStorageViewEnabled,
    useStorageGroupsHandlerAvailable,
    useStorageStatsAvailable,
    useTopicDataAvailable,
} from '../../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {EPathSubType, EPathType} from '../../../types/api/schema';
import {uiFactory} from '../../../uiFactory/uiFactory';
import {useIsViewerUser} from '../../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoringTab} from '../../../utils/monitoringVisibility';
import {isDatabaseEntityType} from '../utils/schema';

import {getPagesByType} from './DiagnosticsPages';
import type {DatabasePagesDisplay, Page} from './DiagnosticsPages';

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

    const {controlPlane, databaseType} = useTenantBaseInfo(isDatabase ? database : '');
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();

    const hasConfigs = useConfigAvailable();
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const newStorageViewEnabled = useNewStorageViewEnabled();
    const storageGroupsAvailable = useStorageGroupsHandlerAvailable();
    const storageStatsAvailable = useStorageStatsAvailable();
    const hasStorageUsage =
        newStorageViewEnabled &&
        (capabilitiesLoaded ? storageGroupsAvailable && storageStatsAvailable : true);
    const hasTopicData = useTopicDataAvailable();
    const isViewerUser = useIsViewerUser();

    return React.useMemo(() => {
        return getPagesByType(type, subType, {
            hasTopicData,
            isDatabase,
            hasStorageUsage,
            hasBackups: typeof uiFactory.renderBackups === 'function' && Boolean(controlPlane),
            hasConfigs: isViewerUser && hasConfigs,
            hasAccess: uiFactory.hasAccess,
            hasMonitoring: canShowTenantMonitoringTab(controlPlane, clusterMonitoring),
            databaseType,
            databasePagesDisplay,
        });
    }, [
        type,
        subType,
        hasTopicData,
        isDatabase,
        hasStorageUsage,
        controlPlane,
        isViewerUser,
        hasConfigs,
        clusterMonitoring,
        databaseType,
        databasePagesDisplay,
    ]);
}
