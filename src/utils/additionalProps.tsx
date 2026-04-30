import {ChartAreaStacked, ListUl} from '@gravity-ui/icons';

import i18n from '../components/TenantNameWrapper/i18n';
import type {AdditionalTenantsProps, DatabaseLink} from '../types/additionalProps';
import type {ETenantType} from '../types/api/tenant';

import {CLUSTER_LINK_CONTEXT} from './clusterLinks/clusterLinkConstants';

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
            links.push({
                title: i18n('field_monitoring-link'),
                url: link,
                icon: ChartAreaStacked,
                context: CLUSTER_LINK_CONTEXT.MONITORING,
            });
        }
    }

    if (additionalProps.getLogsLink) {
        const link = additionalProps.getLogsLink(name);
        if (link) {
            links.push({
                title: i18n('field_logs-link'),
                url: link,
                icon: ListUl,
                context: CLUSTER_LINK_CONTEXT.LOGGING,
            });
        }
    }

    if (additionalProps.getLinks) {
        links.push(...additionalProps.getLinks(name, type));
    }

    return links;
}

export function getInfoTabLinks(
    additionalProps?: AdditionalTenantsProps,
    name?: string,
    type?: ETenantType,
) {
    if (!additionalProps) {
        return [];
    }

    const links: DatabaseLink[] = [];

    if (additionalProps.getLogsLink) {
        const link = additionalProps.getLogsLink(name);
        if (link) {
            links.push({
                title: i18n('field_logs-link'),
                url: link,
                icon: ListUl,
                context: CLUSTER_LINK_CONTEXT.LOGGING,
            });
        }
    }

    if (additionalProps.getLinks) {
        links.push(...additionalProps.getLinks(name, type));
    }

    return links;
}
