import {MonitoringButton} from '../../../components/MonitoringButton/MonitoringButton';
import type {GetMonitoringLink} from '../../../utils/monitoring';
import type Tenant from '../../Tenant/Tenant';
import {useClusterData} from '../useClusterData';

export interface ExtendedTenantProps {
    component: typeof Tenant;
    getMonitoringLink?: GetMonitoringLink;
}

export function ExtendedTenant({
    component: TenantComponent,
    getMonitoringLink,
}: ExtendedTenantProps) {
    const {additionalNodesProps, cluster, monitoring} = useClusterData();

    const additionalTenantProps = {
        getMonitoringLink: (dbName?: string, dbType?: string) => {
            if (monitoring && dbName && dbType && getMonitoringLink) {
                const href = getMonitoringLink({
                    monitoring,
                    dbName,
                    dbType,
                    clusterName: cluster?.Name,
                });
                return href ? <MonitoringButton href={href} visible={true} /> : null;
            }

            return null;
        },
    };

    return (
        <TenantComponent
            additionalTenantProps={additionalTenantProps}
            additionalNodesProps={additionalNodesProps}
        />
    );
}
