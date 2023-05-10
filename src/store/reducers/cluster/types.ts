import {FETCH_CLUSTER} from './cluster';

import type {TClusterInfo} from '../../../types/api/cluster';
import type {ApiRequestAction} from '../../utils';

export interface ClusterState {
    loading: boolean;
    wasLoaded: boolean;
    data?: TClusterInfo;
    error?: unknown;
}

export type ClusterAction = ApiRequestAction<typeof FETCH_CLUSTER, TClusterInfo, unknown>;
