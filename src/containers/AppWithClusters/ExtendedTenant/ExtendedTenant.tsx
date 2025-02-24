import {useClusterBaseInfo} from '../../../store/reducers/cluster/cluster';
import type {ETenantType} from '../../../types/api/tenant';
import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';
import type {GetMonitoringLink} from '../../../utils/monitoring';
import type {Tenant} from '../../Tenant/Tenant';

export interface ExtendedTenantProps {
    component: typeof Tenant;
    getMonitoringLink?: GetMonitoringLink;
}

export function ExtendedTenant({
    component: TenantComponent,
    getMonitoringLink,
}: ExtendedTenantProps) {
    const {monitoring} = useClusterBaseInfo();
    const additionalNodesProps = useAdditionalNodesProps();

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
