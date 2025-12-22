import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {PreparedVersion} from '../../utils/versions/types';

export interface GroupedNodesItem {
    title?: string;
    isDatabase?: boolean;
    nodes?: PreparedStorageNode[];
    items?: GroupedNodesItem[];
    versionColor?: string;
    preparedVersions?: PreparedVersion[];
}

export enum GroupByValue {
    VERSION = 'Version',
    TENANT = 'Database',
    STORAGE = 'Storage',
}
