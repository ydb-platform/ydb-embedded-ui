import type {NodesGroupByField, NodesPeerRole} from '../../../types/api/nodes';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';

export interface NodesFilters {
    searchValue: string;
    withProblems: boolean;
    uptimeFilter: NodesUptimeFilterValues;
    peerRoleFilter?: NodesPeerRole;

    path?: string;
    databaseFullPath?: string;
    useMetaProxy?: boolean;
    database?: string;
    nodeId?: string;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;
}
