import React from 'react';

import {
    selectAllHealthcheckInfo,
    selectCheckStatus,
} from '../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import {useTypedSelector} from '../../utils/hooks';
import {Healthcheck} from '../Tenant/Healthcheck/Healthcheck';
import {HealthcheckDrawer} from '../Tenant/Healthcheck/components/HealthcheckDrawer';
import tenantI18n from '../Tenant/i18n';
import {useTenantQueryParams} from '../Tenant/useTenantQueryParams';

export type DatabaseStatusClickHandler = (tenant: PreparedTenant) => void;

interface DatabaseDrawerHealthcheckProps {
    children: (onStatusClick: DatabaseStatusClickHandler) => React.ReactNode;
    clusterName?: string;
}

export function DatabaseDrawerHealthcheck({children, clusterName}: DatabaseDrawerHealthcheckProps) {
    const [selectedTenant, setSelectedTenant] = React.useState<PreparedTenant>();
    const {handleIssuesFilterChange, handleHealthcheckViewChange} = useTenantQueryParams();

    const database = selectedTenant?.Name ?? '';
    const selectedClusterName = clusterName ?? selectedTenant?.Cluster;
    const databaseType = selectedTenant?.Type;

    const healthcheckStatus = useTypedSelector((state) =>
        selectCheckStatus(state, database, selectedClusterName),
    );
    const healthcheckData = useTypedSelector((state) =>
        selectAllHealthcheckInfo(state, database, selectedClusterName),
    );

    const handleStatusClick = React.useCallback((tenant: PreparedTenant) => {
        if (tenant.Name) {
            setSelectedTenant(tenant);
        }
    }, []);

    const handleCloseDrawer = React.useCallback(() => {
        setSelectedTenant(undefined);
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [handleHealthcheckViewChange, handleIssuesFilterChange]);

    const renderDrawerContent = React.useCallback(() => {
        if (!database) {
            return null;
        }

        return (
            <Healthcheck
                database={database}
                clusterName={selectedClusterName}
                databaseType={databaseType}
            />
        );
    }, [database, databaseType, selectedClusterName]);

    const title = `${tenantI18n('title_healthcheck-dashboard')}${database ? `: ${database}` : ''}`;

    return (
        <HealthcheckDrawer
            isDrawerVisible={Boolean(database)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="database-list-healthcheck-details"
            storageKey="database-list-healthcheck-details-drawer-width"
            title={title}
            status={healthcheckStatus}
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${database}-healthcheck`}
            downloadTooltip={tenantI18n('action_download-healthcheck')}
            isDownloadDisabled={!healthcheckData}
        >
            {children(handleStatusClick)}
        </HealthcheckDrawer>
    );
}
