import React from 'react';

import {ErrorBoundary} from '../../components/ErrorBoundary/ErrorBoundary';
import {
    useBlobStorageCapacityMetricsAvailable,
    useDetailedStorageViewAvailable,
} from '../../store/reducers/capabilities/hooks';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {Navigation} from '../AsideNavigation/Navigation';
import {
    applyBlobStorageCapacityMetricsSettingAvailability,
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
    const blobMetricsAvailable = useBlobStorageCapacityMetricsAvailable();
    const detailedStorageViewAvailable = useDetailedStorageViewAvailable();
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    let finalUserSettings: YDBEmbeddedUISettings =
        userSettings ?? getUserSettings({singleClusterMode});

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
        blobMetricsAvailable && Boolean(isUserAllowedToMakeChanges),
    );

    return (
        <Navigation userSettings={finalUserSettings}>
            <ErrorBoundary>{children}</ErrorBoundary>
        </Navigation>
    );
}
