import type {OrderType} from '@gravity-ui/react-data-table';

import type {IResponseError} from '../../../types/api/error';
import type {TSystemStateInfo} from '../../../types/api/nodes';
import type {EVersion, TStorageGroupInfo} from '../../../types/api/storage';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {ValueOf} from '../../../types/common';
import type {NodesSortValue, NodesUptimeFilterValues} from '../../../utils/nodes';
import type {StorageSortValue} from '../../../utils/storage';
import type {ApiRequestAction} from '../../utils';

import {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';
import {
    FETCH_STORAGE,
    setDataWasNotLoaded,
    setGroupsSortParams,
    setInitialState,
    setNodesSortParams,
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
    PDisks?: PreparedPDisk[];
    VDisks?: PreparedVDisk[];

    DC?: string;
    Rack?: string;

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
    Kind?: string;

    UsedSpaceFlag: number;

    VDisks?: PreparedVDisk[];
}

export interface UsageFilter {
    threshold: number;
    count: number;
}

export interface StorageSortParams {
    sortOrder?: OrderType;
    sortValue?: StorageSortValue;
}

export interface StorageSortAndFilterParams extends StorageSortParams {
    filter?: string; // PoolName or GroupId

    offset?: number;
    limit?: number;
}

export interface StorageApiRequestParams extends StorageSortAndFilterParams {
    tenant?: string;
    nodeId?: string | number;
    poolName?: string;
    groupId?: string | number;
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
    groupsSortValue?: StorageSortValue;
    groupsSortOrder?: OrderType;
    nodesSortValue?: NodesSortValue;
    nodesSortOrder?: OrderType;
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
    | ReturnType<typeof setDataWasNotLoaded>
    | ReturnType<typeof setNodesSortParams>
    | ReturnType<typeof setGroupsSortParams>;

export interface StorageStateSlice {
    storage: StorageState;
}
