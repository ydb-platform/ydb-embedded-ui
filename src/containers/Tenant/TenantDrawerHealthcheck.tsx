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

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerHealthcheck({children}: TenantDrawerWrapperProps) {
    const {database} = useCurrentSchema();
    const {
        handleShowHealthcheckChange,
        showHealthcheck,
        handleIssuesFilterChange,
        handleHealthcheckViewChange,
    } = useTenantQueryParams();

    const healthcheckStatus = useTypedSelector((state) => selectCheckStatus(state, database || ''));

    const healthcheckData = useTypedSelector((state) =>
        selectAllHealthcheckInfo(state, database || ''),
    );

    const handleCloseDrawer = React.useCallback(() => {
        handleShowHealthcheckChange(false);
        handleIssuesFilterChange(undefined);
        handleHealthcheckViewChange(undefined);
    }, [handleShowHealthcheckChange, handleIssuesFilterChange, handleHealthcheckViewChange]);

    const renderDrawerContent = React.useCallback(() => {
        return <Healthcheck database={database} />;
    }, [database]);

    return (
        <HealthcheckDrawer
            isDrawerVisible={Boolean(showHealthcheck)}
            onCloseDrawer={handleCloseDrawer}
            renderDrawerContent={renderDrawerContent}
            drawerId="tenant-healthcheck-details"
            storageKey="tenant-healthcheck-details-drawer-width"
            title={i18n('label_healthcheck-dashboard')}
            status={healthcheckStatus}
            healthcheckData={healthcheckData}
            downloadFilePrefix={`${database}-healthcheck`}
            downloadTooltip={i18n('label_download')}
        >
            {children}
        </HealthcheckDrawer>
    );
}
