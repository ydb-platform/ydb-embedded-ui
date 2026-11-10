import React from 'react';

import {selectMetaHealthFreshnessAvailable} from '../../store/reducers/capabilities/capabilities';
import {clustersApi} from '../../store/reducers/clusters/clusters';
import {
    healthcheckApi,
    selectAllClusterHealthcheckInfo,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import {SelfCheckResult} from '../../types/api/healthcheck';
import {getHealthStatusError} from '../../utils/healthStatus/healthStatus';
import {
    useEffectiveHealth,
    useHealthStatusError,
} from '../../utils/healthStatus/useEffectiveHealth';
import {useTypedSelector} from '../../utils/hooks';
import {Healthcheck} from '../Tenant/Healthcheck/Healthcheck';
import {HealthcheckDrawer} from '../Tenant/Healthcheck/components/HealthcheckDrawer';
import healthcheckI18n from '../Tenant/Healthcheck/i18n';
import tenantI18n from '../Tenant/i18n';
import {useTenantQueryParams} from '../Tenant/useTenantQueryParams';

interface ClusterDrawerHealthcheckProps {
    clusterName?: string;
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const selectClustersList = clustersApi.endpoints.getClustersList.select(undefined);

export function ClusterDrawerHealthcheck({
    clusterName,
    isVisible,
    onClose,
    children,
}: ClusterDrawerHealthcheckProps) {
    const {handleIssuesFilterChange, handleHealthcheckViewChange} = useTenantQueryParams();

    const selectQuery = React.useMemo(
        () =>
            healthcheckApi.endpoints.getClusterHealthcheckInfo.select({
                clusterName: clusterName || '',
            }),
        [clusterName],
    );
    const queryError = useTypedSelector((state) => selectQuery(state).error);
    const data = useTypedSelector((state) =>
        selectAllClusterHealthcheckInfo(state, clusterName || ''),
    );
    const {now, error: healthError} = useHealthStatusError(data, queryError, {enabled: isVisible});
    const separateCurrentHealth = useTypedSelector(
        (state) =>
            selectMetaHealthFreshnessAvailable(state, '/meta/clusters') &&
            selectMetaHealthFreshnessAvailable(state, '/meta/cluster_health'),
    );
    const currentData = useTypedSelector(
        (state) =>
            selectClustersList(state).data?.find((cluster) => cluster.name === clusterName)
                ?.cluster,
    );
    const currentQueryError = useTypedSelector((state) => selectClustersList(state).error);
    const currentHealth = useEffectiveHealth(
        isVisible && separateCurrentHealth ? currentData : undefined,
    );
    const currentError = currentHealth
        ? currentHealth.error
        : getHealthStatusError(undefined, now, currentQueryError) ||
          healthcheckI18n('description_current-health-unavailable');
    const drawerCurrentHealth = React.useMemo(
        () => (separateCurrentHealth ? {...currentHealth, error: currentError} : undefined),
        [separateCurrentHealth, currentHealth, currentError],
    );
    const healthcheckStatus = healthError ? SelfCheckResult.UNSPECIFIED : data?.self_check_result;
    const healthcheckData = data
        ? {...data, self_check_result: healthcheckStatus, error: healthError}
        : undefined;

    const handleCloseDrawer = React.useCallback(() => {
        onClose();
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [onClose, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        if (!clusterName) {
            return null;
        }
        return (
            <Healthcheck
                clusterName={clusterName}
                healthStatusNow={now}
                currentHealth={drawerCurrentHealth}
            />
        );
    }, [clusterName, now, drawerCurrentHealth]);

    return (
        <HealthcheckDrawer
            target={clusterName ? {scope: 'cluster', request: {clusterName}} : undefined}
            isDrawerVisible={isVisible && Boolean(clusterName)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="cluster-healthcheck-details"
            storageKey="cluster-healthcheck-details-drawer-width"
            title={`${tenantI18n('title_healthcheck-dashboard')}${
                clusterName ? `: ${clusterName}` : ''
            }`}
            status={healthcheckStatus}
            currentHealth={drawerCurrentHealth}
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${clusterName}-cluster-healthcheck`}
            downloadTooltip={tenantI18n('action_download-healthcheck')}
            isDownloadDisabled={!healthcheckData}
        >
            {children}
        </HealthcheckDrawer>
    );
}
