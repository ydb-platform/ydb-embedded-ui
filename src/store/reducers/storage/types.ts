import type {OrderType} from '@gravity-ui/react-data-table';
import {z} from 'zod';

import type {TSystemStateInfo} from '../../../types/api/nodes';
import type {EVersion, TStorageGroupInfo} from '../../../types/api/storage';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import type {StorageSortValue} from '../../../utils/storage';

import {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';

export const visibleEntitiesSchema = z.nativeEnum(VISIBLE_ENTITIES).catch(VISIBLE_ENTITIES.all);
export type VisibleEntities = z.infer<typeof visibleEntitiesSchema>;
export const storageTypeSchema = z.nativeEnum(STORAGE_TYPES).catch(STORAGE_TYPES.groups);
export type StorageType = z.infer<typeof storageTypeSchema>;

export interface PreparedStorageNodeFilters {
    searchValue: string;
    nodesUptimeFilter: NodesUptimeFilterValues;
    visibleEntities: VisibleEntities;
    tenant?: string;
}

export interface PreparedStorageNode extends TSystemStateInfo {
    NodeId: number;
    PDisks?: PreparedPDisk[];
    VDisks?: PreparedVDisk[];

    DC?: string;
    Rack?: string;

    Missing: number;
    Uptime: string;
}

export interface PreparedStorageGroupFilters {
    searchValue: string;
    visibleEntities: VisibleEntities;
    tenant?: string;
    nodeId?: string;
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
    sortOrder: OrderType | undefined;
    sortValue: StorageSortValue | undefined;
}

export interface StorageSortAndFilterParams extends Partial<StorageSortParams> {
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

export interface PreparedStorageResponse {
    nodes?: PreparedStorageNode[];
    groups?: PreparedStorageGroup[];
    found: number | undefined;
    total: number | undefined;
}
