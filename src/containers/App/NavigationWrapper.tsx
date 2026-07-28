import React from 'react';

import {ErrorBoundary} from '../../components/ErrorBoundary/ErrorBoundary';
import {
    useBlobStorageCapacityMetricsAvailable,
    useDetailedStorageViewAvailable,
} from '../../store/reducers/capabilities/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {Navigation} from '../AsideNavigation/Navigation';
import {
    applyBlobStorageCapacityMetricsSettingAvailability,
    applyClusterSpecificQueryStreamingSetting,
    applyDetailedStorageViewSettingAvailability,
    applyStorageExpertModeSettingAvailability,
    getUserSettings,
} from '../UserSettings/settings';
import type {YDBEmbeddedUISettings} from '../UserSettings/settings';

interface NavigationWrapperProps {
    singleClusterMode: boolean;
    userSettings?: YDBEmbeddedUISettings;
    children: React.ReactNode;
}

export function NavigationWrapper({
    singleClusterMode,
    userSettings,
    children,
}: NavigationWrapperProps) {
    const clusterName = useClusterNameFromQuery();

    const blobMetricsAvailable = useBlobStorageCapacityMetricsAvailable();
    const detailedStorageViewAvailable = useDetailedStorageViewAvailable();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    let finalUserSettings: YDBEmbeddedUISettings;

    if (userSettings) {
        // Apply cluster-specific logic to externally provided settings
        finalUserSettings = applyClusterSpecificQueryStreamingSetting(userSettings, clusterName);
    } else {
        // Generate settings internally with cluster-specific logic
        finalUserSettings = getUserSettings({
            singleClusterMode,
            clusterName,
        });
    }

    finalUserSettings = applyDetailedStorageViewSettingAvailability(
        finalUserSettings,
        detailedStorageViewAvailable,
    );

    // Hide the Blob Storage Capacity Metrics experiment if the backend doesn't support it
    finalUserSettings = applyBlobStorageCapacityMetricsSettingAvailability(
        finalUserSettings,
        blobMetricsAvailable,
    );

    finalUserSettings = applyStorageExpertModeSettingAvailability(
        finalUserSettings,
        isUserAllowedToMakeChanges,
    );

    return (
        <Navigation userSettings={finalUserSettings}>
            <ErrorBoundary>{children}</ErrorBoundary>
        </Navigation>
    );
}
