import type {IResponseError} from '../api/error';
import type {TComputeInfo} from '../api/compute';

import {NodesUptimeFilterValues} from '../../utils/nodes';
import {
    FETCH_NODES,
    clearNodes,
    setDataWasNotLoaded,
    setNodesUptimeFilter,
} from '../../store/reducers/nodes';
import {ApiRequestAction} from '../../store/utils';

export interface INodesState {
    loading: boolean;
    wasLoaded: boolean;
    nodesUptimeFilter: NodesUptimeFilterValues;
    data?: TComputeInfo;
    error?: IResponseError;
}

type INodesApiRequestNodeType = 'static' | 'dynamic' | 'any';

// Space - out of space nodes
// Missing - nodes with missing disks
type INodesApiRequestProblemType = 'missing' | 'space';

export interface INodesApiRequestParams {
    tenant?: string;
    type?: INodesApiRequestNodeType;
    filter?: INodesApiRequestProblemType;
    storage?: boolean;
    tablets?: boolean;
}

type INodesApiRequestAction = ApiRequestAction<typeof FETCH_NODES, TComputeInfo, IResponseError>;

export type INodesAction =
    | INodesApiRequestAction
    | (
          | ReturnType<typeof clearNodes>
          | ReturnType<typeof setDataWasNotLoaded>
          | ReturnType<typeof setNodesUptimeFilter>
      );

export interface INodesRootStateSlice {
    nodes: INodesState;
}
