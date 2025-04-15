import {DefinitionList, Flex} from '@gravity-ui/uikit';

import {getTenantPath} from '../../containers/Tenant/TenantPages';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
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

    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = Boolean(backend);

    const monitoringLink = additionalTenantsProps?.getMonitoringLink?.(tenant.Name, tenant.Type);
    const logsLink = additionalTenantsProps?.getLogsLink?.(tenant.Name);

    const infoPopoverContent =
        (monitoringLink || logsLink) && isUserAllowedToMakeChanges ? (
            <DefinitionList responsive>
                <DefinitionList.Item name={i18n('field_links')}>
                    <Flex gap={2} wrap="wrap">
                        {monitoringLink && (
                            <LinkWithIcon
                                title={i18n('field_monitoring-link')}
                                url={monitoringLink}
                            />
                        )}
                        {logsLink && (
                            <LinkWithIcon title={i18n('field_logs-link')} url={logsLink} />
                        )}
                    </Flex>
                </DefinitionList.Item>
            </DefinitionList>
        ) : null;

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
                    database: tenant.Name,
                    backend,
                },
                {withBasename: isExternalLink},
            )}
        />
    );
}
