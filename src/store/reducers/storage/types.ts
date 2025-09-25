import {z} from 'zod';

import type {EFlag} from '../../../types/api/enums';
import type {NodesGroupByField, TNodeInfo} from '../../../types/api/nodes';
import type {Erasure, GroupsGroupByField} from '../../../types/api/storage';
import type {TTabletStateInfo} from '../../../types/api/tablet';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {NodesUptimeFilterValues, PreparedNodeSystemState} from '../../../utils/nodes';

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
    nodeId?: string | number;
    groupId?: string | number;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;
}

export interface PreparedStorageNode
    extends PreparedNodeSystemState,
        Omit<TNodeInfo, 'SystemState' | 'PDisks' | 'VDisks' | 'Tablets'> {
    NodeId: number;

    PDisks?: PreparedPDisk[];
    VDisks?: PreparedVDisk[];
    Tablets?: TTabletStateInfo[];

    Missing: number;
    MaximumSlotsPerDisk: number;
    MaximumDisksPerNode: number;
}

export interface PreparedStorageGroupFilters {
    searchValue: string;
    visibleEntities: VisibleEntities;

    database?: string;
    nodeId?: string | number;
    groupId?: string | number;
    pDiskId?: string | number;

    filterGroup?: string;
    filterGroupBy?: GroupsGroupByField;
}

export interface PreparedStorageGroup {
    PoolName?: string;
    PileName?: string;
    MediaType?: string;
    Encryption?: boolean;
    ErasureSpecies?: Erasure;
    Degraded: number;
    Overall?: EFlag;

    GroupId?: string | number;

    Usage?: number;
    Read: number;
    Write: number;
    Used: number;
    Limit: number;

    DiskSpaceUsage?: number;

    DiskSpace: EFlag;

    VDisks?: PreparedVDisk[];

    Kind?: string;
    ChangeTime?: number | string;
    GroupGeneration?: string;
    Latency?: EFlag;
    AcquiredUnits?: string;
    AcquiredIOPS?: number;
    AcquiredThroughput?: string;
    AcquiredSize?: string;
    MaximumIOPS?: number;
    MaximumThroughput?: string;
    MaximumSize?: string;

    AllocationUnits?: string | number;
    State?: string;
    MissingDisks?: string | number;
    Available?: string;

    LatencyPutTabletLogMs?: number;
    LatencyPutUserDataMs?: number;
    LatencyGetFastMs?: number;
}

export type TableGroup = {
    name: string;
    count: number;
};

export interface PreparedStorageResponse {
    nodes?: PreparedStorageNode[];
    groups?: PreparedStorageGroup[];
    found: number | undefined;
    total: number | undefined;
    tableGroups?: TableGroup[];
    columnsSettings?: {
        maxSlotsPerDisk: number;
        maxDisksPerNode: number;
    };
}
