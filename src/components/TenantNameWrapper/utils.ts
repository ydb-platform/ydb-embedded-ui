import {getTenantPath} from '../../routes';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';

export function getTenantBackend(
    tenant: Pick<PreparedTenant, 'NodeIds'> & Partial<Pick<PreparedTenant, 'sharedNodeIds'>>,
    additionalTenantsProps?: AdditionalTenantsProps,
) {
    if (typeof additionalTenantsProps?.prepareTenantBackend !== 'function') {
        return undefined;
    }

    let nodeId: string | undefined;
    const nodeIds = tenant.NodeIds ?? tenant.sharedNodeIds;
    if (nodeIds && nodeIds.length > 0) {
        const index = Math.floor(Math.random() * nodeIds.length);
        nodeId = nodeIds[index].toString();
    }
    return additionalTenantsProps.prepareTenantBackend(nodeId);
}

export function getTenantLink({
    tenant,
    additionalTenantsProps,
    externalLink,
    useDatabaseId,
}: {
    tenant: PreparedTenant;
    additionalTenantsProps?: AdditionalTenantsProps;
    externalLink?: boolean;
    useDatabaseId?: boolean;
}) {
    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = Boolean(externalLink || backend);
    const database = useDatabaseId ? tenant.Id : tenant.Name;

    return {
        database,
        isExternalLink,
        href: getTenantPath(
            {clusterName: tenant.Cluster, database, backend},
            {withBasename: isExternalLink},
        ),
    };
}
