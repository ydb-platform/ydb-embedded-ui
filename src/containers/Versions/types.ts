import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {PreparedVersion} from '../../utils/versions/types';

export interface GroupedNodesItem {
    title?: string;
    isDatabase?: boolean;
    nodes?: NodesPreparedEntity[];
    items?: GroupedNodesItem[];
    versionColor?: string;
    preparedVersions?: PreparedVersion[];
}

export enum GroupByValue {
    VERSION = 'Version',
    TENANT = 'Database',
    STORAGE = 'Storage',
}
