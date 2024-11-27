import type {NodesPreparedEntity} from '../../store/reducers/nodes/types';
import type {VersionValue} from '../../types/versions';

export interface GroupedNodesItem {
    title?: string;
    nodes?: NodesPreparedEntity[];
    items?: GroupedNodesItem[];
    versionColor?: string;
    versionsValues?: VersionValue[];
}

export enum GroupByValue {
    VERSION = 'Version',
    TENANT = 'Database',
    STORAGE = 'Storage',
}
