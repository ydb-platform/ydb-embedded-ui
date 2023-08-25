import type {ReactNode} from 'react';

import type {InfoViewerItem} from '../components/InfoViewer';
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
    getMonitoringLink?: (name?: string, type?: ETenantType) => ReactNode;
}
