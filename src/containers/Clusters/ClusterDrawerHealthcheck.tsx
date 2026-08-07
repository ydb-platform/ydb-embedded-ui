import React from 'react';

import {
    selectAllClusterHealthcheckInfo,
    selectClusterCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
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

    const healthcheckStatus = useTypedSelector((state) =>
        selectClusterCheckStatus(state, clusterName || ''),
    );

    const healthcheckData = useTypedSelector((state) =>
        selectAllClusterHealthcheckInfo(state, clusterName || ''),
    );

    const handleCloseDrawer = React.useCallback(() => {
        onClose();
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [onClose, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        if (!clusterName) {
            return null;
        }
        return <Healthcheck clusterName={clusterName} />;
    }, [clusterName]);

    return (
        <HealthcheckDrawer
            isDrawerVisible={isVisible && Boolean(clusterName)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="cluster-healthcheck-details"
            storageKey="cluster-healthcheck-details-drawer-width"
            title={`${tenantI18n('label_healthcheck-dashboard')}${
                clusterName ? `: ${clusterName}` : ''
            }`}
            status={healthcheckStatus}
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${clusterName}-cluster-healthcheck`}
            downloadTooltip={tenantI18n('label_download')}
            isDownloadDisabled={!healthcheckData}
        >
            {children}
        </HealthcheckDrawer>
    );
}
