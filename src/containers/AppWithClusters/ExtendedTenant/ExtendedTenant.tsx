import type {GetDatabaseLinks} from '../../../uiFactory/types';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';
import type {GetLogsLink} from '../../../utils/logs';
import type {GetMonitoringLink} from '../../../utils/monitoring';
import type {Tenant} from '../../Tenant/Tenant';
import {useAdditionalTenantsProps} from '../utils/useAdditionalTenantsProps';

export interface ExtendedTenantProps {
    component: typeof Tenant;
    getMonitoringLink?: GetMonitoringLink;
    getLogsLink?: GetLogsLink;
    getDatabaseLinks?: GetDatabaseLinks;
}

export function ExtendedTenant({
    component: TenantComponent,
    getMonitoringLink,
    getLogsLink,
    getDatabaseLinks,
}: ExtendedTenantProps) {
    const additionalNodesProps = useAdditionalNodesProps();
    const additionalTenantProps = useAdditionalTenantsProps({
        getMonitoringLink,
        getLogsLink,
        getDatabaseLinks,
    });

    return (
        <TenantComponent
            additionalTenantProps={additionalTenantProps}
            additionalNodesProps={additionalNodesProps}
        />
    );
}
