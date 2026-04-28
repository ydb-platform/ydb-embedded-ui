import type {IconData} from '@gravity-ui/uikit';

import type {TSystemStateInfo} from './api/nodes';
import type {ETenantType} from './api/tenant';
import type {InfoItem} from './components';

interface ClusterLinkBase {
    url: string;
    icon?: IconData;
    description?: string;
}

/** A link with an explicit title (context is optional) */
export interface ClusterLinkWithTitle extends ClusterLinkBase {
    title: string;
    context?: string;
}

/** A link with a known context that provides a default title */
interface ClusterLinkWithContext extends ClusterLinkBase {
    title?: string;
    context: string;
}

/** Input cluster link: either title or context (or both) must be provided */
export type ClusterLink = ClusterLinkWithTitle | ClusterLinkWithContext;

export interface DatabaseLink {
    title: string;
    url: string;
    icon: IconData;
}

export interface AdditionalClusterProps {
    info?: InfoItem[];
    links?: ClusterLink[];
}

export interface AdditionalTenantsProps {
    prepareTenantBackend?: (nodeId?: string | number) => string | undefined;
    getMonitoringLink?: (name?: string, type?: ETenantType) => string | null;
    getLogsLink?: (name?: string) => string | null;
    getLinks?: (name?: string, type?: ETenantType) => DatabaseLink[];
}

export type NodeAddress = Pick<TSystemStateInfo, 'Host' | 'Endpoints' | 'NodeId'>;
