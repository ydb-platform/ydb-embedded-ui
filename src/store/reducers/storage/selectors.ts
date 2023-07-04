import {Selector, createSelector} from 'reselect';
import {getUsage} from '../../../utils/storage';

import type {TNodeInfo} from '../../../types/api/nodes';
import {TPDiskState} from '../../../types/api/pdisk';
import {EVDiskState, TVDiskStateInfo} from '../../../types/api/vdisk';
import {EFlag} from '../../../types/api/enums';
import {getPDiskType} from '../../../utils/pdisk';
import {calcUptime} from '../../../utils';

import type {
    PreparedStorageGroup,
    PreparedStorageNode,
    RawStorageGroup,
    StorageStateSlice,
    UsageFilter,
} from './types';
import {filterNodesByUptime} from '../nodes/nodes';

// ==== Prepare data ====
const FLAGS_POINTS = {
    [EFlag.Green]: 1,
    [EFlag.Yellow]: 100,
    [EFlag.Orange]: 10_000,
    [EFlag.Red]: 1_000_000,
};

const prepareStorageGroupData = (
    group: RawStorageGroup,
    poolName?: string,
): PreparedStorageGroup => {
    let missing = 0;
    let usedSpaceFlag = 0;
    let usedSpaceBytes = 0;
    let limitSizeBytes = 0;
    let readSpeedBytesPerSec = 0;
    let writeSpeedBytesPerSec = 0;
    let mediaType = '';

    if (group.VDisks) {
        for (const vDisk of group.VDisks) {
            const {
                Replicated,
                VDiskState,
                AvailableSize,
                AllocatedSize,
                PDisk,
                DiskSpace,
                ReadThroughput,
                WriteThroughput,
            } = vDisk;

            if (
                !Replicated ||
                PDisk?.State !== TPDiskState.Normal ||
                VDiskState !== EVDiskState.OK
            ) {
                missing += 1;
            }

            if (DiskSpace && DiskSpace !== EFlag.Grey) {
                usedSpaceFlag += FLAGS_POINTS[DiskSpace];
            }

            const available = Number(AvailableSize ?? PDisk?.AvailableSize) || 0;
            const allocated = Number(AllocatedSize) || 0;

            usedSpaceBytes += allocated;
            limitSizeBytes += available + allocated;

            readSpeedBytesPerSec += Number(ReadThroughput) || 0;
            writeSpeedBytesPerSec += Number(WriteThroughput) || 0;

            const currentType = getPDiskType(PDisk || {});
            mediaType =
                currentType && (currentType === mediaType || mediaType === '')
                    ? currentType
                    : 'Mixed';
        }
    }

    // VDisk doesn't have its own StoragePoolName when located inside StoragePool data
    const vDisks = group.VDisks?.map((vdisk) => ({
        ...vdisk,
        StoragePoolName: poolName,
        Donors: vdisk.Donors?.map((donor) => ({
            ...donor,
            StoragePoolName: poolName,
        })),
    }));

    return {
        ...group,
        VDisks: vDisks,
        Read: readSpeedBytesPerSec,
        Write: writeSpeedBytesPerSec,
        PoolName: poolName,
        Used: usedSpaceBytes,
        Limit: limitSizeBytes,
        Missing: missing,
        UsedSpaceFlag: usedSpaceFlag,
        Type: mediaType || null,
    };
};

const prepareStorageNodeData = (node: TNodeInfo): PreparedStorageNode => {
    const systemState = node.SystemState ?? {};
    const missing =
        node.PDisks?.filter((pDisk) => {
            return pDisk.State !== TPDiskState.Normal;
        }).length || 0;

    return {
        NodeId: node.NodeId,
        SystemState: systemState.SystemState,
        DataCenter: systemState.DataCenter,
        Rack: systemState.Rack,
        Host: systemState.Host,
        Endpoints: systemState.Endpoints,
        Uptime: calcUptime(systemState.StartTime),
        StartTime: systemState.StartTime,
        PDisks: node.PDisks,
        Missing: missing,
    };
};

// ==== Filters ====

const prepareSearchText = (text: string) => text.trim().toLowerCase();

const filterNodesByText = (entities: PreparedStorageNode[], text: string) => {
    const preparedSearch = prepareSearchText(text);

    if (!preparedSearch) {
        return entities;
    }

    return entities.filter((entity) => {
        return (
            entity.NodeId?.toString().includes(preparedSearch) ||
            entity.Host?.toLowerCase().includes(preparedSearch)
        );
    });
};
const filterGroupsByText = (entities: PreparedStorageGroup[], text: string) => {
    const preparedSearch = prepareSearchText(text);

    if (!preparedSearch) {
        return entities;
    }

    return entities.filter((entity) => {
        return (
            entity.PoolName?.toLowerCase().includes(preparedSearch) ||
            entity.GroupID?.toString().includes(preparedSearch)
        );
    });
};

const filterGroupsByUsage = (entities: PreparedStorageGroup[], usage?: string[]) => {
    if (!Array.isArray(usage) || usage.length === 0) {
        return entities;
    }

    return entities.filter((entity) => {
        const entityUsage = getUsage(entity, 5);
        return usage.some((val) => Number(val) <= entityUsage && entityUsage < Number(val) + 5);
    });
};

// ==== Simple selectors ====

export const selectStoragePools = (state: StorageStateSlice) => state.storage.groups?.StoragePools;
export const selectStorageGroupsCount = (state: StorageStateSlice) => ({
    total: state.storage.groups?.TotalGroups || 0,
    found: state.storage.groups?.FoundGroups || 0,
});
export const selectStorageNodes = (state: StorageStateSlice) => state.storage.nodes?.Nodes;
export const selectStorageNodesCount = (state: StorageStateSlice) => ({
    total: state.storage.nodes?.TotalNodes || 0,
    found: state.storage.nodes?.FoundNodes || 0,
});

export const selectStorageFilter = (state: StorageStateSlice) => state.storage.filter;
export const selectUsageFilter = (state: StorageStateSlice) => state.storage.usageFilter;
export const selectVisibleEntities = (state: StorageStateSlice) => state.storage.visible;
export const selectNodesUptimeFilter = (state: StorageStateSlice) =>
    state.storage.nodesUptimeFilter;
export const selectStorageType = (state: StorageStateSlice) => state.storage.type;

// ==== Complex selectors ====

const selectPreparedStorageNodes: Selector<StorageStateSlice, PreparedStorageNode[]> =
    createSelector(selectStorageNodes, (storageNodes) => {
        if (!storageNodes) {
            return [];
        }

        return storageNodes.map(prepareStorageNodeData);
    });

export const selectPreparedStorageGroups: Selector<StorageStateSlice, PreparedStorageGroup[]> =
    createSelector(selectStoragePools, (storagePools) => {
        const preparedGroups: PreparedStorageGroup[] = [];

        storagePools?.forEach((pool) => {
            pool.Groups?.forEach((group) => {
                preparedGroups.push(prepareStorageGroupData(group, pool.Name));
            });
        });

        return preparedGroups;
    });

export const selectVDisksForPDisk: Selector<
    StorageStateSlice,
    TVDiskStateInfo[] | undefined,
    [number | undefined, number | undefined]
> = createSelector(
    [
        selectStorageNodes,
        (_state, nodeId: number | undefined) => nodeId,
        (_state, _nodeId, pdiskId: number | undefined) => pdiskId,
    ],
    (storageNodes, nodeId, pdiskId) => {
        const targetNode = storageNodes?.find((node) => node.NodeId === nodeId);
        return targetNode?.VDisks?.filter((vdisk) => vdisk.PDiskId === pdiskId).map((data) => ({
            ...data,
            NodeId: nodeId,
        }));
    },
);

export const selectUsageFilterOptions: Selector<StorageStateSlice, UsageFilter[]> = createSelector(
    selectPreparedStorageGroups,
    (groups) => {
        const items: Record<number, number> = {};

        groups.forEach((group) => {
            const usage = getUsage(group, 5);

            if (!Object.prototype.hasOwnProperty.call(items, usage)) {
                items[usage] = 0;
            }

            items[usage] += 1;
        });

        return Object.entries(items)
            .map(([threshold, count]) => ({threshold: Number(threshold), count}))
            .sort((a, b) => b.threshold - a.threshold);
    },
);

// ==== Complex selectors with filters ====

export const selectFilteredNodes: Selector<StorageStateSlice, PreparedStorageNode[]> =
    createSelector(
        [selectPreparedStorageNodes, selectStorageFilter, selectNodesUptimeFilter],
        (storageNodes, textFilter, uptimeFilter) => {
            let result = storageNodes;
            result = filterNodesByText(result, textFilter);
            result = filterNodesByUptime(result, uptimeFilter);

            return result;
        },
    );

export const selectFilteredGroups: Selector<StorageStateSlice, PreparedStorageGroup[]> =
    createSelector(
        [selectPreparedStorageGroups, selectStorageFilter, selectUsageFilter],
        (storageGroups, textFilter, usageFilter) => {
            let result = storageGroups;
            result = filterGroupsByText(result, textFilter);
            result = filterGroupsByUsage(result, usageFilter);

            return result;
        },
    );
