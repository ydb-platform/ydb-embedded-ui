import type {IResponseError} from '../../../types/api/error';
import type {TSystemStateInfo} from '../../../types/api/nodes';
import type {TPDiskStateInfo} from '../../../types/api/pdisk';
import type {EVersion, TStorageGroupInfo} from '../../../types/api/storage';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import type {ValueOf} from '../../../types/common';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import type {ApiRequestAction} from '../../utils';

import {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';
import {
    FETCH_STORAGE,
    setDataWasNotLoaded,
    setInitialState,
    setNodesUptimeFilter,
    setStorageTextFilter,
    setStorageType,
    setUsageFilter,
    setVisibleEntities,
} from './storage';

export type VisibleEntities = ValueOf<typeof VISIBLE_ENTITIES>;
export type StorageType = ValueOf<typeof STORAGE_TYPES>;

export interface PreparedStorageNode extends TSystemStateInfo {
    NodeId: number;
    PDisks: TPDiskStateInfo[] | undefined;
    VDisks: TVDiskStateInfo[] | undefined;

    Missing: number;
    Uptime: string;
}

export interface PreparedStorageGroup extends TStorageGroupInfo {
    PoolName: string | undefined;

    Usage: number;
    Read: number;
    Write: number;
    Used: number;
    Limit: number;
    Degraded: number;
    Kind: string | undefined;

    UsedSpaceFlag: number;
}

export interface UsageFilter {
    threshold: number;
    count: number;
}

export interface StorageApiRequestParams {
    tenant?: string;
    nodeId?: string;
    visibleEntities?: VisibleEntities;

    version?: EVersion;
}

export interface StorageState {
    loading: boolean;
    wasLoaded: boolean;
    filter: string;
    usageFilter: string[];
    visible: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    type: StorageType;
    nodes?: PreparedStorageNode[];
    groups?: PreparedStorageGroup[];
    found?: number;
    total?: number;
    error?: IResponseError;
}

export interface PreparedStorageResponse {
    nodes?: PreparedStorageNode[];
    groups?: PreparedStorageGroup[];
    found: number | undefined;
    total: number | undefined;
}

type GetStorageInfoApiRequestAction = ApiRequestAction<
    typeof FETCH_STORAGE,
    PreparedStorageResponse,
    IResponseError
>;

export type StorageAction =
    | GetStorageInfoApiRequestAction
    | ReturnType<typeof setInitialState>
    | ReturnType<typeof setStorageType>
    | ReturnType<typeof setStorageTextFilter>
    | ReturnType<typeof setUsageFilter>
    | ReturnType<typeof setVisibleEntities>
    | ReturnType<typeof setNodesUptimeFilter>
    | ReturnType<typeof setDataWasNotLoaded>;

export interface StorageStateSlice {
    storage: StorageState;
}
