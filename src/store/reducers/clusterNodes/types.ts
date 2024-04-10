import type {IResponseError} from '../../../types/api/error';
import type {TSystemStateInfo} from '../../../types/api/nodes';
import type {ApiRequestAction} from '../../utils';

import type {FETCH_CLUSTER_NODES} from './clusterNodes';

export interface PreparedClusterNode extends TSystemStateInfo {
    uptime: string;
}

export interface ClusterNodesState {
    loading: boolean;
    wasLoaded: boolean;
    nodes?: PreparedClusterNode[];
    error?: IResponseError;
}

export type ClusterNodesAction = ApiRequestAction<
    typeof FETCH_CLUSTER_NODES,
    PreparedClusterNode[],
    IResponseError
>;
