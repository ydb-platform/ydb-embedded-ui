import type {IResponseError} from '../../../types/api/error';
import type {TNodesInfo, TSystemStateInfo} from '../../../types/api/nodes';
import type {TPDiskStateInfo} from '../../../types/api/pdisk';
import type {TStorageGroupInfo, TStorageInfo} from '../../../types/api/storage';
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

    Missing: number;
    Uptime: string;
}

export interface PreparedStorageGroup extends TStorageGroupInfo {
    PoolName: string | undefined;

    Read: number;
    Write: number;
    Used: number;
    Limit: number;
    Missing: number;
    UsedSpaceFlag: number;
    Type: string | null;
}

export interface UsageFilter {
    threshold: number;
    count: number;
}

export interface StorageApiRequestParams {
    tenant?: string;
    nodeId?: string;
    visibleEntities?: VisibleEntities;
}

export interface StorageState {
    loading: boolean;
    wasLoaded: boolean;
    filter: string;
    usageFilter: string[];
    visible: VisibleEntities;
    nodesUptimeFilter: NodesUptimeFilterValues;
    type: StorageType;
    nodes?: TNodesInfo;
    groups?: TStorageInfo;
    error?: IResponseError;
}

type GetStorageInfoApiRequestAction = ApiRequestAction<
    typeof FETCH_STORAGE,
    {nodes?: TNodesInfo; groups?: TStorageInfo},
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
