import React from 'react';

import {DrawerContextProvider} from '../../components/Drawer/DrawerContext';

import {TenantDrawerHealthcheck} from './TenantDrawerHealthcheck';
import {TenantDrawerRights} from './TenantDrawerRights';

interface TenantDrawerWrapperProps {
    children: React.ReactNode;
}

export function TenantDrawerWrapper({children, database}: TenantDrawerWrapperProps) {
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
        return <Healthcheck tenantName={database} />;
    }, [database]);

    return (
        <DrawerContextProvider>
            <TenantDrawerHealthcheck>
                <TenantDrawerRights>{children}</TenantDrawerRights>
            </TenantDrawerHealthcheck>
        </DrawerContextProvider>
    );
}
