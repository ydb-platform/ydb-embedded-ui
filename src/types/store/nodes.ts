import {NodesUptimeFilterValues} from '../../utils/nodes';
import {
    FETCH_NODES,
    clearNodes,
    setDataWasNotLoaded,
    setNodesUptimeFilter,
} from '../../store/reducers/nodes';
import {ApiRequestAction} from '../../store/utils';
import {IResponseError} from '../api/error';
import {TNodesInfo} from '../api/nodes';

export interface INodesState {
    loading: boolean;
    wasLoaded: boolean;
    nodesUptimeFilter: NodesUptimeFilterValues;
    data?: TNodesInfo;
    error?: IResponseError;
}

type INodesApiRequestAction = ApiRequestAction<typeof FETCH_NODES, TNodesInfo, IResponseError>;

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
