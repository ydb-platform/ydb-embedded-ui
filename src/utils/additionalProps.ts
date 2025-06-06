import {FileText} from '@gravity-ui/icons';

import i18n from '../components/TenantNameWrapper/i18n';
import {backend} from '../store';
import type {
    AdditionalNodesProps,
    AdditionalTenantsProps,
    DatabaseLink,
} from '../types/additionalProps';
import type {ETenantType} from '../types/api/tenant';

import {getBackendFromBalancerAndNodeId} from './prepareBackend';

import monitoringIcon from '../assets/icons/monitoring.svg';

export const getAdditionalNodesProps = (balancer = backend): AdditionalNodesProps => {
    return {
        getNodeRef: (node) => getBackendFromBalancerAndNodeId(node?.NodeId, balancer ?? ''),
    };
};

export function getDatabaseLinks(
    additionalProps?: AdditionalTenantsProps,
    name?: string,
    type?: ETenantType,
) {
    if (!additionalProps) {
        return [];
    }

    const links: DatabaseLink[] = [];
    if (additionalProps.getMonitoringLink) {
        const link = additionalProps.getMonitoringLink(name, type);
        if (link) {
            links.push({title: i18n('field_monitoring-link'), url: link, icon: monitoringIcon});
        }
    }

    if (additionalProps.getLogsLink) {
        const link = additionalProps.getLogsLink(name);
        if (link) {
            links.push({title: i18n('field_logs-link'), url: link, icon: FileText});
        }
    }

    if (additionalProps.getLinks) {
        links.push(...additionalProps.getLinks(name, type));
    }

    return links;
}
