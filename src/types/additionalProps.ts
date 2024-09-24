import type {InfoViewerItem} from '../components/InfoViewer';

import type {TSystemStateInfo} from './api/nodes';
import type {ETenantType} from './api/tenant';
import type {VersionToColorMap} from './versions';

export interface AdditionalVersionsProps {
    getVersionToColorMap?: () => VersionToColorMap;
}

export interface ClusterLink {
    title: string;
    url: string;
}

export interface AdditionalClusterProps {
    info?: InfoViewerItem[];
    links?: ClusterLink[];
}

export interface AdditionalTenantsProps {
    prepareTenantBackend?: (backend: string | undefined) => string | undefined;
    getMonitoringLink?: (name?: string, type?: ETenantType) => React.ReactNode;
}

export type NodeAddress = Pick<TSystemStateInfo, 'Host' | 'Endpoints' | 'NodeId'>;

export type GetNodeRefFunc = (node?: NodeAddress) => string | null;

export interface AdditionalNodesProps extends Record<string, unknown> {
    getNodeRef?: GetNodeRefFunc;
}
