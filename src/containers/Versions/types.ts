import type {VersionValue} from '../../types/versions';
import type {PreparedClusterNode} from '../../store/reducers/clusterNodes/types';

export interface GroupedNodesItem {
    title?: string;
    nodes?: PreparedClusterNode[];
    items?: GroupedNodesItem[];
    versionColor?: string;
    versionsValues?: VersionValue[];
}

export enum GroupByValue {
    VERSION = 'Version',
    TENANT = 'Database',
    STORAGE = 'Storage',
}
