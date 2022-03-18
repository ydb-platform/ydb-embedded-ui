import {createRequestActionTypes, createApiRequest} from '../utils';
import '../../services/api';
import _ from 'lodash';
import {createSelector} from 'reselect';
import {calcUptime} from '../../utils';

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
const SET_VISIBLE_GROUPS = 'storage/SET_VISIBLE_GROUPS';
const SET_STORAGE_TYPE = 'storage/SET_STORAGE_TYPE';

const initialState = {
    loading: true,
    wasLoaded: false,
    filter: '',
    visible: VisibleEntities.Missing,
    type: StorageTypes.groups,
};

const storage = function z(state = initialState, action) {
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
            return {
                ...state,
                error: action.error,
                loading: false,
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
        case SET_VISIBLE_GROUPS: {
            return {
                ...state,
                visible: action.data,
            };
        }
        case SET_STORAGE_TYPE: {
            return {
                ...state,
                type: action.data,
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

export function getStorageInfo({tenant, filter, nodeId, type}) {
    return createApiRequest({
        request: window.api.getStorageInfo({tenant, filter, nodeId, type}),
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
export function setVisibleEntities(value) {
    return {
        type: SET_VISIBLE_GROUPS,
        data: value,
    };
}

export const getStoragePools = (state) => state.storage.data?.StoragePools;
export const getStorageNodes = (state) => state.storage.data?.Nodes;
export const getStorageFilter = (state) => state.storage.filter;
export const getVisibleEntities = (state) => state.storage.visible;
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

export const getFilteredEntities = createSelector(
    [getStorageFilter, getStorageType, getVisibleEntitiesList],
    (filter, type, entities) => {
        const cleanedFilter = filter.trim().toLowerCase();
        if (!cleanedFilter) {
            return entities;
        } else {
            return _.filter(entities, (e) => {
                if (type === StorageTypes.groups) {
                    return (
                        e.PoolName.toLowerCase().includes(cleanedFilter) ||
                        e.GroupID?.toString().includes(cleanedFilter)
                    );
                }
                return (
                    e.NodeId.toString().includes(cleanedFilter) ||
                    e.FQDN.toLowerCase().includes(cleanedFilter)
                );
            });
        }
    },
);

export default storage;
