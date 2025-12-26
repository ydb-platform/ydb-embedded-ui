import React from 'react';

import {ErrorBoundary} from '../../components/ErrorBoundary/ErrorBoundary';
import {useBlobStorageCapacityMetricsAvailable} from '../../store/reducers/capabilities/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {Navigation} from '../AsideNavigation/Navigation';
import {
    applyBlobStorageCapacityMetricsSettingAvailability,
    applyClusterSpecificQueryStreamingSetting,
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

    let finalUserSettings: YDBEmbeddedUISettings;

    if (userSettings) {
        // Apply cluster-specific logic to externally provided settings
        finalUserSettings = applyClusterSpecificQueryStreamingSetting(userSettings, clusterName);
        finalUserSettings = applyBlobStorageCapacityMetricsSettingAvailability(
            finalUserSettings,
            blobMetricsAvailable,
        );
    } else {
        // Generate settings internally with cluster-specific logic
        finalUserSettings = getUserSettings({
            singleClusterMode,
            clusterName,
        });

        finalUserSettings = applyBlobStorageCapacityMetricsSettingAvailability(
            finalUserSettings,
            blobMetricsAvailable,
        );
    }

    return (
        <Navigation userSettings={finalUserSettings}>
            <ErrorBoundary>{children}</ErrorBoundary>
        </Navigation>
    );
}
