import React from 'react';

import {
    healthcheckApi,
    selectAllClusterHealthcheckInfo,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import {SelfCheckResult} from '../../types/api/healthcheck';
import {getHealthStatusError} from '../../utils/healthStatus/healthStatus';
import {useHealthStatusNow} from '../../utils/healthStatus/useHealthStatusNow';
import {useTypedSelector} from '../../utils/hooks';
import {Healthcheck} from '../Tenant/Healthcheck/Healthcheck';
import {HealthcheckDrawer} from '../Tenant/Healthcheck/components/HealthcheckDrawer';
import tenantI18n from '../Tenant/i18n';
import {useTenantQueryParams} from '../Tenant/useTenantQueryParams';

interface ClusterDrawerHealthcheckProps {
    clusterName?: string;
    isVisible: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function ClusterDrawerHealthcheck({
    clusterName,
    isVisible,
    onClose,
    children,
}: ClusterDrawerHealthcheckProps) {
    const {handleIssuesFilterChange, handleHealthcheckViewChange} = useTenantQueryParams();

    const now = useHealthStatusNow(isVisible);
    const query = useTypedSelector((state) =>
        healthcheckApi.endpoints.getClusterHealthcheckInfo.select({clusterName: clusterName || ''})(
            state,
        ),
    );
    const data = useTypedSelector((state) =>
        selectAllClusterHealthcheckInfo(state, clusterName || ''),
    );
    const healthError = data ? getHealthStatusError(data, now, query.error) : undefined;
    const healthcheckStatus = healthError ? SelfCheckResult.UNSPECIFIED : data?.self_check_result;
    const healthcheckData = data
        ? {...data, self_check_result: healthcheckStatus, error: healthError}
        : undefined;
    if (healthcheckData) {
        delete healthcheckData.healthExpiresAt;
    }

    const handleCloseDrawer = React.useCallback(() => {
        onClose();
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [onClose, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        if (!clusterName) {
            return null;
        }
        return <Healthcheck clusterName={clusterName} healthStatusNow={now} />;
    }, [clusterName, now]);

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
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${clusterName}-cluster-healthcheck`}
            downloadTooltip={tenantI18n('action_download-healthcheck')}
            isDownloadDisabled={!healthcheckData}
        >
            {children}
        </HealthcheckDrawer>
    );
}
