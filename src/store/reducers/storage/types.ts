import type {OrderType} from '@gravity-ui/react-data-table';
import {z} from 'zod';

import type {EFlag} from '../../../types/api/enums';
import type {TSystemStateInfo} from '../../../types/api/nodes';
import type {StorageV2SortValue} from '../../../types/api/storage';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {NodesUptimeFilterValues} from '../../../utils/nodes';

import {STORAGE_TYPES, VISIBLE_ENTITIES} from './constants';

export const visibleEntitiesSchema = z.nativeEnum(VISIBLE_ENTITIES).catch(VISIBLE_ENTITIES.all);
export type VisibleEntities = z.infer<typeof visibleEntitiesSchema>;
export const storageTypeSchema = z.nativeEnum(STORAGE_TYPES).catch(STORAGE_TYPES.groups);
export type StorageType = z.infer<typeof storageTypeSchema>;

export interface PreparedStorageNodeFilters {
    searchValue: string;
    nodesUptimeFilter: NodesUptimeFilterValues;
    visibleEntities: VisibleEntities;
    database?: string;
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
    database?: string;
    nodeId?: string;
}

export interface PreparedStorageGroup {
    PoolName?: string;
    MediaType?: string;
    Encryption?: boolean;
    ErasureSpecies?: string;
    Degraded: number;

    GroupId?: string | number;

    Usage: number;
    Read: number;
    Write: number;
    Used: number;
    Limit: number;

    DiskSpace: EFlag;

    VDisks?: PreparedVDisk[];
}

export interface UsageFilter {
    threshold: number;
    count: number;
}

export interface StorageSortParams {
    sortOrder: OrderType | undefined;
    sortValue: StorageV2SortValue | undefined;
}

export interface PreparedStorageResponse {
    nodes?: PreparedStorageNode[];
    groups?: PreparedStorageGroup[];
    found: number | undefined;
    total: number | undefined;
}
