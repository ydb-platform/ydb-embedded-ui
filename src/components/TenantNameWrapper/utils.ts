import {getTenantPath} from '../../routes';
import {backend as activeBackend} from '../../store';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import type {MetaClusterSettings} from '../../types/api/meta';
import {getDatabaseNavigationId} from '../../utils/databaseId';

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
    isMetaDatabasesAvailable,
    settings,
}: {
    tenant: PreparedTenant;
    additionalTenantsProps?: AdditionalTenantsProps;
    externalLink?: boolean;
    useDatabaseId?: boolean;
    isMetaDatabasesAvailable?: boolean;
    settings?: MetaClusterSettings;
}) {
    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = Boolean(externalLink || backend);
    const database = getDatabaseNavigationId(tenant, {
        useDatabaseId,
        isMetaDatabasesAvailable,
        settings,
        backend: backend ?? activeBackend,
    });

    return {
        database,
        isExternalLink,
        href: getTenantPath(
            {clusterName: tenant.Cluster, database, backend},
            {withBasename: isExternalLink},
        ),
    };
}
