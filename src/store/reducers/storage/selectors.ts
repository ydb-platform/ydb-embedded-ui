import type {NodesUptimeFilterValues} from '../../../utils/nodes';
import {filterNodesByUptime} from '../nodes/selectors';

import type {PreparedStorageGroup, PreparedStorageNode} from './types';

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
            entity.GroupId?.toString().includes(preparedSearch)
        );
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

export function filterGroups(storageGroups: PreparedStorageGroup[], textFilter: string) {
    let result = storageGroups || [];
    result = filterGroupsByText(result, textFilter);

    return result;
}
