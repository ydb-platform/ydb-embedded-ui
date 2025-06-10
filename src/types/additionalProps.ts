import type {IconData} from '@gravity-ui/uikit';

import type {TSystemStateInfo} from './api/nodes';
import type {ETenantType} from './api/tenant';
import type {InfoItem} from './components';

export interface ClusterLink {
    title: string;
    url: string;
}

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

export type GetNodeRefFunc = (node?: NodeAddress) => string | undefined;

export interface AdditionalNodesProps extends Record<string, unknown> {
    getNodeRef?: GetNodeRefFunc;
}
