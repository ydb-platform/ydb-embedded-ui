import React from 'react';

import {
    selectAllHealthcheckInfo,
    selectCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import {useTypedSelector} from '../../utils/hooks';

import {Healthcheck} from './Healthcheck/Healthcheck';
import {HealthcheckDrawer} from './Healthcheck/components/HealthcheckDrawer';
import {useCurrentSchema} from './TenantContext';
import i18n from './i18n';
import {useTenantQueryParams} from './useTenantQueryParams';

interface TenantDrawerHealthcheckProps {
    children: React.ReactNode;
    clusterName?: string;
}

export function TenantDrawerHealthcheck({children, clusterName}: TenantDrawerHealthcheckProps) {
    const {database} = useCurrentSchema();
    const {
        handleShowHealthcheckChange,
        showHealthcheck,
        handleIssuesFilterChange,
        handleHealthcheckViewChange,
    } = useTenantQueryParams();

    const healthcheckStatus = useTypedSelector((state) =>
        selectCheckStatus(state, database || '', clusterName),
    );

    const healthcheckData = useTypedSelector((state) =>
        selectAllHealthcheckInfo(state, database || '', clusterName),
    );

    const handleCloseDrawer = React.useCallback(() => {
        handleShowHealthcheckChange(false);
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [handleShowHealthcheckChange, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <Healthcheck database={database} clusterName={clusterName} />;
    }, [database, clusterName]);

    return (
        <HealthcheckDrawer
            isDrawerVisible={Boolean(showHealthcheck)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="tenant-healthcheck-details"
            storageKey="tenant-healthcheck-details-drawer-width"
            title={i18n('title_healthcheck-dashboard')}
            status={healthcheckStatus}
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${database}-healthcheck`}
            downloadTooltip={i18n('action_download-healthcheck')}
        >
            {children}
        </HealthcheckDrawer>
    );
}
