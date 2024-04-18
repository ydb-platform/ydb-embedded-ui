import type {OrderType} from '@gravity-ui/react-data-table';

import type {TSystemStateInfo} from '../../../types/api/nodes';
import type {EVersion, TStorageGroupInfo} from '../../../types/api/storage';
import type {ValueOf} from '../../../types/common';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {NodesSortValue, NodesUptimeFilterValues} from '../../../utils/nodes';
import type {StorageSortValue} from '../../../utils/storage';

import type {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';

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
    MediaType?: string;

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
    filter: string;
    usageFilter: string[];
    visible: VisibleEntities;
    uptimeFilter: NodesUptimeFilterValues;
    groupsSortValue?: StorageSortValue;
    groupsSortOrder?: OrderType;
    nodesSortValue?: NodesSortValue;
    nodesSortOrder?: OrderType;
    type: StorageType;
}

export interface PreparedStorageResponse {
    nodes?: PreparedStorageNode[];
    groups?: PreparedStorageGroup[];
    found: number | undefined;
    total: number | undefined;
}

export interface StorageStateSlice {
    storage: StorageState;
}
