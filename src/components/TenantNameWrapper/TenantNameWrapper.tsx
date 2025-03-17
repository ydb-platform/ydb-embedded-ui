import {DefinitionList, PopoverBehavior} from '@gravity-ui/uikit';

import {getTenantPath} from '../../containers/Tenant/TenantPages';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps, NodeAddress} from '../../types/additionalProps';
import {useIsUserAllowedToMakeChanges} from '../../utils/hooks/useIsUserAllowedToMakeChanges';
import {CellWithPopover} from '../CellWithPopover/CellWithPopover';
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

    let backend: string | NodeAddress | undefined = tenant.MonitoringEndpoint ?? tenant.backend;
    const nodeIds = tenant.NodeIds ?? tenant.sharedNodeIds;
    if (!backend && nodeIds && nodeIds.length > 0) {
        const index = Math.floor(Math.random() * nodeIds.length);
        backend = {NodeId: nodeIds[index]};
    }
    return additionalTenantsProps.prepareTenantBackend(backend);
};

export function TenantNameWrapper({tenant, additionalTenantsProps}: TenantNameWrapperProps) {
    const isUserAllowedToMakeChanges = useIsUserAllowedToMakeChanges();

    const backend = getTenantBackend(tenant, additionalTenantsProps);
    const isExternalLink = Boolean(backend);

    const monitoringLink = additionalTenantsProps?.getMonitoringLink?.(tenant.Name, tenant.Type);
    const logsLink = additionalTenantsProps?.getLogsLink?.(tenant.Name);

    return (
        <CellWithPopover
            disabled={!isUserAllowedToMakeChanges || (!monitoringLink && !logsLink)}
            delayClosing={200}
            content={
                monitoringLink || logsLink ? (
                    <DefinitionList responsive>
                        <DefinitionList.Item name={i18n('field_links')}>
                            {monitoringLink && (
                                <LinkWithIcon
                                    title={i18n('field_monitoring-link')}
                                    url={monitoringLink}
                                />
                            )}
                            {logsLink && (
                                <LinkWithIcon title={i18n('field_logs-link')} url={logsLink} />
                            )}
                        </DefinitionList.Item>
                    </DefinitionList>
                ) : null
            }
            placement={['top', 'bottom']}
            behavior={PopoverBehavior.Immediate}
        >
            <EntityStatus
                externalLink={isExternalLink}
                name={tenant.Name || i18n('context_unknown')}
                withLeftTrim={true}
                status={tenant.Overall}
                hasClipboardButton
                path={getTenantPath({
                    database: tenant.Name,
                    backend,
                })}
            />
        </CellWithPopover>
    );
}
