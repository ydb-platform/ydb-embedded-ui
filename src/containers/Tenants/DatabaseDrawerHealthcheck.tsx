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

export type DatabaseStatusClickHandler = (
    tenant: PreparedTenant,
    database: string | undefined,
) => void;

interface SelectedDatabase {
    tenant: PreparedTenant;
    database: string;
}

interface DatabaseDrawerHealthcheckProps {
    children: (onStatusClick: DatabaseStatusClickHandler) => React.ReactNode;
    clusterName?: string;
}

export function DatabaseDrawerHealthcheck({children, clusterName}: DatabaseDrawerHealthcheckProps) {
    const [selectedDatabase, setSelectedDatabase] = React.useState<SelectedDatabase>();
    const {handleIssuesFilterChange, handleHealthcheckViewChange} = useTenantQueryParams();

    const selectedTenant = selectedDatabase?.tenant;
    const database = selectedDatabase?.database ?? '';
    const databaseName = selectedTenant?.Name ?? '';
    const selectedClusterName = clusterName ?? selectedTenant?.Cluster;
    const databaseType = selectedTenant?.Type;

    const healthcheckStatus = useTypedSelector((state) =>
        selectCheckStatus(state, database, selectedClusterName),
    );
    const healthcheckData = useTypedSelector((state) =>
        selectAllHealthcheckInfo(state, database, selectedClusterName),
    );

    const handleStatusClick = React.useCallback(
        (tenant: PreparedTenant, selectedDatabaseValue: string | undefined) => {
            if (selectedDatabaseValue && tenant.Type !== 'Serverless') {
                setSelectedDatabase({tenant, database: selectedDatabaseValue});
            }
        },
        [],
    );

    const handleCloseDrawer = React.useCallback(() => {
        setSelectedDatabase(undefined);
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

    const title = `${tenantI18n('title_healthcheck-dashboard')}${
        databaseName ? `: ${databaseName}` : ''
    }`;

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
            downloadFilePrefix={`${databaseName || database}-healthcheck`}
            downloadTooltip={tenantI18n('action_download-healthcheck')}
            isDownloadDisabled={!healthcheckData}
        >
            {children(handleStatusClick)}
        </HealthcheckDrawer>
    );
}
