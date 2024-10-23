import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {ETenantType} from '../../../types/api/tenant';
import type {GetMonitoringLink} from '../../../utils/monitoring';
import type {Tenant} from '../../Tenant/Tenant';
import {useAdditionalNodeProps} from '../useClusterData';

export interface ExtendedTenantProps {
    component: typeof Tenant;
    getMonitoringLink?: GetMonitoringLink;
}

export function ExtendedTenant({
    component: TenantComponent,
    getMonitoringLink,
}: ExtendedTenantProps) {
    const {balancer, monitoring} = useClusterBaseInfo();
    const {additionalNodesProps} = useAdditionalNodeProps({balancer});

    const additionalTenantProps = {
        getMonitoringLink: (dbName?: string, dbType?: ETenantType) => {
            if (monitoring && dbName && dbType && getMonitoringLink) {
                return getMonitoringLink({
                    monitoring,
                    dbName,
                    dbType,
                });
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
