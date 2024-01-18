import type Tenant from '../../Tenant/Tenant';
import type {GetMonitoringLink} from '../../../utils/monitoring';

import {useClusterData} from '../useClusterData';

import {MonitoringButton} from '../../../components/MonitoringButton/MonitoringButton';

export interface InternalTenantProps {
    component: typeof Tenant;
    getMonitoringLink?: GetMonitoringLink;
}

export function InternalTenant({
    component: TenantComponent,
    getMonitoringLink,
}: InternalTenantProps) {
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
