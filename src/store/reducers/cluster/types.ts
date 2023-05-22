import {FETCH_CLUSTER} from './cluster';

import type {TClusterInfo} from '../../../types/api/cluster';
import type {ApiRequestAction} from '../../utils';
import type {IResponseError} from '../../../types/api/error';

export interface ClusterState {
    loading: boolean;
    wasLoaded: boolean;
    data?: TClusterInfo;
    error?: IResponseError;
}

export type ClusterAction = ApiRequestAction<typeof FETCH_CLUSTER, TClusterInfo, IResponseError>;
