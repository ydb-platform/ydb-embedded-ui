import type {VersionValue} from '../../types/versions';
import type {PreparedNodeSystemState} from '../../utils/nodes';

export interface GroupedNodesItem {
    title?: string;
    nodes?: PreparedNodeSystemState[];
    items?: GroupedNodesItem[];
    versionColor?: string;
    versionsValues?: VersionValue[];
}

export enum GroupByValue {
    VERSION = 'Version',
    TENANT = 'Database',
    STORAGE = 'Storage',
}
