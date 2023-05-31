import type {InfoViewerItem} from '../components/InfoViewer';
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
