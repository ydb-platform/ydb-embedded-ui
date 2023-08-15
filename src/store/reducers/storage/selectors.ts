import {Selector, createSelector} from 'reselect';

import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import {getUsage} from '../../../utils/storage';

import {filterNodesByUptime} from '../nodes/selectors';
import type {
    PreparedStorageGroup,
    PreparedStorageNode,
    StorageStateSlice,
    UsageFilter,
} from './types';

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
        const entityUsage = entity.Usage;
        return usage.some((val) => Number(val) <= entityUsage && entityUsage < Number(val) + 5);
    });
};

// ==== Simple selectors ====

export const selectEntitiesCount = (state: StorageStateSlice) => ({
    total: state.storage.total,
    found: state.storage.found,
});

export const selectStorageGroups = (state: StorageStateSlice) => state.storage.groups;
export const selectStorageNodes = (state: StorageStateSlice) => state.storage.nodes;

export const selectStorageFilter = (state: StorageStateSlice) => state.storage.filter;
export const selectUsageFilter = (state: StorageStateSlice) => state.storage.usageFilter;
export const selectVisibleEntities = (state: StorageStateSlice) => state.storage.visible;
export const selectNodesUptimeFilter = (state: StorageStateSlice) =>
    state.storage.nodesUptimeFilter;
export const selectStorageType = (state: StorageStateSlice) => state.storage.type;

// ==== Complex selectors ====

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
    selectStorageGroups,
    (groups) => {
        const items: Record<number, number> = {};

        groups?.forEach((group) => {
            // Get groups usage with step 5
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
        [selectStorageNodes, selectStorageFilter, selectNodesUptimeFilter],
        (storageNodes, textFilter, uptimeFilter) => {
            let result = storageNodes || [];
            result = filterNodesByText(result, textFilter);
            result = filterNodesByUptime(result, uptimeFilter);

            return result;
        },
    );

export const selectFilteredGroups: Selector<StorageStateSlice, PreparedStorageGroup[]> =
    createSelector(
        [selectStorageGroups, selectStorageFilter, selectUsageFilter],
        (storageGroups, textFilter, usageFilter) => {
            let result = storageGroups || [];
            result = filterGroupsByText(result, textFilter);
            result = filterGroupsByUsage(result, usageFilter);

            return result;
        },
    );
