import _ from 'lodash';
import {createSelector} from 'reselect';

import {calcUptime, calcUptimeInSeconds} from '../../utils';
import {getUsage} from '../../utils/storage';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {getPDiskType} from '../../utils/pdisk';
import {HOUR_IN_SECONDS} from '../../utils/constants';
import '../../services/api';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const VisibleEntities = {
    All: 'All',
    Missing: 'Missing',
    Space: 'Space',
};

export const VisibleEntitiesTitles = {
    [VisibleEntities.All]: 'All',
    [VisibleEntities.Missing]: 'Degraded',
    [VisibleEntities.Space]: 'Out of Space',
};

export const StorageTypes = {
    groups: 'Groups',
    nodes: 'Nodes',
};

const FETCH_STORAGE = createRequestActionTypes('storage', 'FETCH_STORAGE');
const SET_INITIAL = 'storage/SET_INITIAL';
const SET_FILTER = 'storage/SET_FILTER';
const SET_USAGE_FILTER = 'storage/SET_USAGE_FILTER';
const SET_VISIBLE_GROUPS = 'storage/SET_VISIBLE_GROUPS';
const SET_STORAGE_TYPE = 'storage/SET_STORAGE_TYPE';
const SET_NODES_UPTIME_FILTER = 'storage/SET_NODES_UPTIME_FILTER';
const SET_DATA_WAS_NOT_LOADED = 'storage/SET_DATA_WAS_NOT_LOADED';

const initialState = {
    loading: true,
    wasLoaded: false,
    filter: '',
    usageFilter: [],
    visible: VisibleEntities.Missing,
    nodesUptimeFilter: NodesUptimeFilterValues.All,
    type: StorageTypes.groups,
};

const storage = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_STORAGE.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_STORAGE.SUCCESS: {
            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_STORAGE.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
                wasLoaded: true,
            };
        }
        case SET_INITIAL: {
            return {
                ...initialState,
            };
        }
        case SET_FILTER: {
            return {
                ...state,
                filter: action.data,
            };
        }
        case SET_USAGE_FILTER: {
            return {
                ...state,
                usageFilter: action.data,
            };
        }
        case SET_VISIBLE_GROUPS: {
            return {
                ...state,
                visible: action.data,
                wasLoaded: false,
                error: undefined,
            };
        }

        case SET_NODES_UPTIME_FILTER: {
            return {
                ...state,
                nodesUptimeFilter: action.data,
            };
        }
        case SET_STORAGE_TYPE: {
            return {
                ...state,
                type: action.data,
                filter: '',
                usageFilter: [],
                wasLoaded: false,
                error: undefined,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        default:
            return state;
    }
};

export function setInitialState() {
    return {
        type: SET_INITIAL,
    };
}

export function getStorageInfo({tenant, filter, nodeId, type}, {concurrentId}) {
    return createApiRequest({
        request: window.api.getStorageInfo({tenant, filter, nodeId, type}, {concurrentId}),
        actions: FETCH_STORAGE,
    });
}

export function setStorageType(value) {
    return {
        type: SET_STORAGE_TYPE,
        data: value,
    };
}

export function setStorageFilter(value) {
    return {
        type: SET_FILTER,
        data: value,
    };
}

export function setUsageFilter(value) {
    return {
        type: SET_USAGE_FILTER,
        data: value,
    };
}

export function setVisibleEntities(value) {
    return {
        type: SET_VISIBLE_GROUPS,
        data: value,
    };
}

export function setNodesUptimeFilter(value) {
    return {
        type: SET_NODES_UPTIME_FILTER,
        data: value,
    };
}

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    };
};

export const getStoragePools = (state) => state.storage.data?.StoragePools;
export const getStoragePoolsGroupsCount = (state) => ({
    total: state.storage.data?.TotalGroups || 0,
    found: state.storage.data?.FoundGroups || 0,
});
export const getStorageNodes = (state) => state.storage.data?.Nodes;
export const getStorageNodesCount = (state) => ({
    total: state.storage.data?.TotalNodes || 0,
    found: state.storage.data?.FoundNodes || 0,
});
export const getStorageFilter = (state) => state.storage.filter;
export const getUsageFilter = (state) => state.storage.usageFilter;
export const getVisibleEntities = (state) => state.storage.visible;
export const getNodesUptimeFilter = (state) => state.storage.nodesUptimeFilter;
export const getStorageType = (state) => state.storage.type;
export const getNodesObject = (state) =>
    _.reduce(
        state.nodesList?.data,
        (acc, el) => {
            acc[el.NodeId] = el.Host;
            return acc;
        },
        {},
    );

const FLAGS_POINTS = {
    Green: 1,
    Yellow: 100,
    Orange: 10_000,
    Red: 1_000_000,
};
export const getFlatListStorageGroups = createSelector([getStoragePools], (storagePools) => {
    return _.reduce(
        storagePools,
        (acc, pool) => {
            const groups = _.reduce(
                pool.Groups,
                (acc, group) => {
                    const missing = _.filter(group.VDisks, (v) => {
                        return !v.Replicated || v.PDisk.State !== 'Normal' || v.VDiskState !== 'OK';
                    }).length;

                    const UsedSpaceFlag = _.reduce(
                        group.VDisks,
                        (acc, v) => {
                            if (v.DiskSpace) {
                                acc += FLAGS_POINTS[v.DiskSpace];
                            }
                            return acc;
                        },
                        0,
                    );

                    const usedSpaceBytes = _.reduce(
                        group.VDisks,
                        (acc, vDisk) => {
                            return acc + (Number(vDisk.AllocatedSize) || 0);
                        },
                        0,
                    );
                    const limitSizeBytes = _.reduce(
                        group.VDisks,
                        (acc, vDisk) => {
                            return (
                                acc +
                                (Number(vDisk.AvailableSize) ||
                                    Number(vDisk.PDisk?.AvailableSize) ||
                                    0) +
                                (Number(vDisk.AllocatedSize) || 0)
                            );
                        },
                        0,
                    );
                    const readSpeedBytesPerSec = _.reduce(
                        group.VDisks,
                        (acc, vDisk) => {
                            return acc + (Number(vDisk.ReadThroughput) || 0);
                        },
                        0,
                    );
                    const writeSpeedBytesPerSec = _.reduce(
                        group.VDisks,
                        (acc, vDisk) => {
                            return acc + (Number(vDisk.WriteThroughput) || 0);
                        },
                        0,
                    );
                    const mediaType = group.VDisks?.reduce((type, vdisk) => {
                        const currentType = getPDiskType(vdisk.PDisk || {});
                        return currentType && (currentType === type || type === '')
                            ? currentType
                            : 'Mixed';
                    }, '');
                    return [
                        ...acc,
                        {
                            ...group,
                            Read: readSpeedBytesPerSec,
                            Write: writeSpeedBytesPerSec,
                            PoolName: pool.Name,
                            Used: usedSpaceBytes,
                            Limit: limitSizeBytes,
                            Missing: missing,
                            UsedSpaceFlag,
                            Type: mediaType || null,
                        },
                    ];
                },
                [],
            );
            return [...acc, ...groups];
        },
        [],
    );
});

export const getFlatListStorageNodes = createSelector([getStorageNodes], (storageNodes) => {
    return _.map(storageNodes, (node) => {
        const systemState = node.SystemState ?? {};
        const missing = _.filter(node.PDisks, (p) => {
            return p.State !== 'Normal';
        }).length;
        return {
            NodeId: node.NodeId,
            FQDN: systemState.Host,
            DataCenter: systemState.DataCenter,
            Rack: systemState.Rack,
            uptime: calcUptime(systemState.StartTime),
            StartTime: systemState.StartTime,
            PDisks: node.PDisks,
            Missing: missing,
        };
    });
});

export const getFlatListStorage = createSelector(
    [getStorageType, getFlatListStorageGroups, getFlatListStorageNodes],
    (storageType, groupsList, nodesList) => {
        if (storageType === StorageTypes.groups) {
            return groupsList;
        }
        return nodesList;
    },
);

export const getVisibleEntitiesList = createSelector(
    [getVisibleEntities, getFlatListStorage],
    (visibleGroups, storageList) => {
        if (visibleGroups === VisibleEntities.All) {
            return storageList;
        } else if (visibleGroups === VisibleEntities.Missing) {
            return _.filter(storageList, (g) => g.Missing > 0);
        } else {
            return _.filter(storageList, (g) => g.UsedSpaceFlag > 100);
        }
    },
);

const filterByText = (entities, type, text) => {
    const cleanedFilter = text.trim().toLowerCase();

    if (!cleanedFilter) {
        return entities;
    }

    return entities.filter((entity) => {
        if (type === StorageTypes.groups) {
            return (
                entity.PoolName.toLowerCase().includes(cleanedFilter) ||
                entity.GroupID?.toString().includes(cleanedFilter)
            );
        }

        return (
            entity.NodeId.toString().includes(cleanedFilter) ||
            entity.FQDN.toLowerCase().includes(cleanedFilter)
        );
    });
};

const filterByUsage = (entities, usage) => {
    if (!Array.isArray(usage) || usage.length === 0) {
        return entities;
    }

    return entities.filter((entity) => {
        const entityUsage = getUsage(entity, 5);
        return usage.some((val) => Number(val) <= entityUsage && entityUsage < Number(val) + 5);
    });
};

export const filterByUptime = (nodes = [], nodesUptimeFilter) => {
    if (nodesUptimeFilter === NodesUptimeFilterValues.All) {
        return nodes;
    }
    return nodes.filter(({StartTime}) => {
        return !StartTime || calcUptimeInSeconds(StartTime) < HOUR_IN_SECONDS;
    });
};

export const getFilteredEntities = createSelector(
    [
        getStorageFilter,
        getUsageFilter,
        getStorageType,
        getNodesUptimeFilter,
        getVisibleEntitiesList,
    ],
    (textFilter, usageFilter, type, nodesUptimeFilter, entities) => {
        let result = entities;
        result = filterByText(result, type, textFilter);
        result = filterByUsage(result, usageFilter);

        if (type === StorageTypes.nodes) {
            result = filterByUptime(result, nodesUptimeFilter);
        }

        return result;
    },
);

export const getUsageFilterOptions = createSelector(getVisibleEntitiesList, (entities) => {
    const items = {};

    entities.forEach((entity) => {
        const usage = getUsage(entity, 5);

        if (!Object.hasOwn(items, usage)) {
            items[usage] = 0;
        }

        items[usage] += 1;
    });

    return Object.entries(items)
        .map(([threshold, count]) => ({threshold, count}))
        .sort((a, b) => b.threshold - a.threshold);
});

export default storage;
