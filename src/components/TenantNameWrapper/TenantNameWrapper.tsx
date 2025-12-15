import {DefinitionList, Flex} from '@gravity-ui/uikit';

import {getTenantPath} from '../../routes';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {uiFactory} from '../../uiFactory/uiFactory';
import {getDatabaseLinks} from '../../utils/additionalProps';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {canShowTenantMonitoring} from '../../utils/monitoringVisibility';
import {EntityStatus} from '../EntityStatus/EntityStatus';
import {LinkWithIcon} from '../LinkWithIcon/LinkWithIcon';

import i18n from './i18n';

interface TenantNameWrapperProps {
    tenant: PreparedTenant;
    additionalTenantsProps?: AdditionalTenantsProps;
}

const getTenantBackend = (
    tenant: PreparedTenant,
    additionalTenantsProps?: AdditionalTenantsProps,
) => {
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
};

export function TenantNameWrapper({tenant, additionalTenantsProps}: TenantNameWrapperProps) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();
    const {settings} = useClusterBaseInfo();

    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = Boolean(backend);

    const links = getDatabaseLinks(additionalTenantsProps, tenant?.Name, tenant?.Type);
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const showMonitoring = canShowTenantMonitoring(tenant?.ControlPlane, clusterMonitoring);
    const filteredLinks = showMonitoring
        ? links
        : links.filter(({title}) => title !== i18n('field_monitoring-link'));

    const infoPopoverContent =
        filteredLinks.length > 0 && isUserAllowedToMakeChanges ? (
            <DefinitionList responsive>
                <DefinitionList.Item name={i18n('field_links')}>
                    <Flex gap={2} wrap="wrap">
                        {filteredLinks.map(({title, url}) => (
                            <LinkWithIcon key={title} title={title} url={url} />
                        ))}
                    </Flex>
                </DefinitionList.Item>
            </DefinitionList>
        ) : null;
    const useDatabaseId = uiFactory.useDatabaseId && settings?.use_meta_proxy !== false;
    return (
        <EntityStatus
            externalLink={isExternalLink}
            name={tenant.Name || i18n('context_unknown')}
            withLeftTrim={true}
            status={tenant.Overall}
            infoPopoverContent={infoPopoverContent}
            hasClipboardButton
            path={getTenantPath(
                {
                    database: useDatabaseId ? tenant.Id : tenant.Name,
                    backend,
                },
                {withBasename: isExternalLink},
            )}
        />
    );
}
