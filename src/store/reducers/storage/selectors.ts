import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import {getUsage} from '../../../utils/storage';
import {filterNodesByUptime} from '../nodes/selectors';

import type {PreparedStorageGroup, PreparedStorageNode, UsageFilter} from './types';

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

export function filterNodes(
    storageNodes: PreparedStorageNode[],
    textFilter: string,
    uptimeFilter: NodesUptimeFilterValues,
) {
    let result = storageNodes || [];
    result = filterNodesByText(result, textFilter);
    result = filterNodesByUptime(result, uptimeFilter);

    return result;
}

export function filterGroups(
    storageGroups: PreparedStorageGroup[],
    textFilter: string,
    usageFilter: string[],
) {
    let result = storageGroups || [];
    result = filterGroupsByText(result, textFilter);
    result = filterGroupsByUsage(result, usageFilter);

    return result;
}

// ==== Complex selectors ====

export function getUsageFilterOptions(groups: PreparedStorageGroup[]): UsageFilter[] {
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
}
