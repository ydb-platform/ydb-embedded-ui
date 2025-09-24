import type {NodesGroupByField, NodesPeerRole} from '../../../types/api/nodes';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import type {ProblemFilterValue} from '../settings/types';

export interface NodesFilters {
    searchValue: string;
    problemFilter: ProblemFilterValue;
    uptimeFilter: NodesUptimeFilterValues;
    peerRoleFilter?: NodesPeerRole;

    path?: string;
    databaseFullPath?: string;
    database?: string;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;
}
