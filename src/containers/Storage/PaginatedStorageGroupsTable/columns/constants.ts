import type {SelectOption} from '@gravity-ui/uikit';
import {z} from 'zod';

import type {
    GroupsGroupByField,
    GroupsRequiredField,
    StorageV2SortValue,
} from '../../../../types/api/storage';
import type {ValueOf} from '../../../../types/common';

import i18n from './i18n';

export const STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY = 'storageGroupsColumnsWidth';
export const STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY = 'storageGroupsSelectedColumns';

export const STORAGE_GROUPS_COLUMNS_IDS = {
    GroupId: 'GroupId',
    PoolName: 'PoolName',
    PileName: 'PileName',
    MediaType: 'MediaType',
    Erasure: 'Erasure',
    Used: 'Used',
    Limit: 'Limit',
    Usage: 'Usage',
    DiskSpaceUsage: 'DiskSpaceUsage',
    DiskSpace: 'DiskSpace',
    Read: 'Read',
    Write: 'Write',
    Latency: 'Latency',
    AllocationUnits: 'AllocationUnits',
    VDisks: 'VDisks',
    VDisksPDisks: 'VDisksPDisks',
    Degraded: 'Degraded',
    State: 'State',
} as const;

export type StorageGroupsColumnId = ValueOf<typeof STORAGE_GROUPS_COLUMNS_IDS>;

// Columns, that should displayed only for users with isMonitoringAllowed:true
const MONITORING_USER_COLUMNS_IDS: StorageGroupsColumnId[] = [
    'DiskSpaceUsage',
    'Latency',
    'AllocationUnits',
    'VDisksPDisks',
];

export function isMonitoringUserGroupsColumn(columnId: string): boolean {
    return MONITORING_USER_COLUMNS_IDS.includes(columnId as StorageGroupsColumnId);
}

export const DEFAULT_STORAGE_GROUPS_COLUMNS: StorageGroupsColumnId[] = [
    'GroupId',
    'PoolName',
    'Erasure',
    'Used',
    'VDisks',
];

// Columns, that should displayed only for users with isViewerAllowed:true
const VIEWER_USER_COLUMNS_IDS: StorageGroupsColumnId[] = ['DiskSpace'];
export function isViewerGroupsColumn(columnId: string): boolean {
    return VIEWER_USER_COLUMNS_IDS.some((el) => el === columnId);
}

export const REQUIRED_STORAGE_GROUPS_COLUMNS: StorageGroupsColumnId[] = ['GroupId'];

// This code is running when module is initialized and correct language may not be set yet
// get functions guarantee that i18n fields will be inited on render with current render language
export const STORAGE_GROUPS_COLUMNS_TITLES = {
    get PoolName() {
        return i18n('pool-name');
    },
    get MediaType() {
        return i18n('type');
    },
    get PileName() {
        return i18n('pile-name');
    },
    get Erasure() {
        return i18n('erasure');
    },
    get GroupId() {
        return i18n('group-id');
    },
    get Used() {
        return i18n('used');
    },
    get Limit() {
        return i18n('limit');
    },
    get Usage() {
        return i18n('usage');
    },
    get DiskSpaceUsage() {
        return i18n('disk-usage');
    },
    get DiskSpace() {
        return i18n('space');
    },
    get Read() {
        return i18n('read');
    },
    get Write() {
        return i18n('write');
    },
    get Latency() {
        return i18n('latency');
    },
    get AllocationUnits() {
        return i18n('allocation-units');
    },
    get VDisks() {
        return i18n('vdisks');
    },
    get VDisksPDisks() {
        return i18n('vdisks-pdisks');
    },
    get Degraded() {
        return i18n('missing-disks');
    },
    get State() {
        return i18n('state');
    },
} as const satisfies Record<StorageGroupsColumnId, string>;

const STORAGE_GROUPS_COLUMNS_GROUP_BY_TITLES = {
    get GroupId() {
        return i18n('group-id');
    },
    get Erasure() {
        return i18n('erasure');
    },
    get Usage() {
        return i18n('usage');
    },
    get DiskSpaceUsage() {
        return i18n('disk-usage');
    },
    get PoolName() {
        return i18n('pool-name');
    },
    get PileName() {
        return i18n('pile-name');
    },
    get Kind() {
        return i18n('type');
    },
    get Encryption() {
        return i18n('encryption');
    },
    get MediaType() {
        return i18n('type');
    },
    get MissingDisks() {
        return i18n('missing-disks');
    },
    get State() {
        return i18n('state');
    },
    get Latency() {
        return i18n('latency');
    },
} as const satisfies Record<GroupsGroupByField, string>;

const STORAGE_GROUPS_GROUP_BY_PARAMS = [
    'PoolName',
    'PileName',
    'MediaType',
    'Encryption',
    'Erasure',
    'Usage',
    'DiskSpaceUsage',
    'State',
    'MissingDisks',
    'Latency',
] as const satisfies GroupsGroupByField[];

export const STORAGE_GROUPS_GROUP_BY_OPTIONS: SelectOption[] = STORAGE_GROUPS_GROUP_BY_PARAMS.map(
    (param) => {
        return {
            value: param,
            content: STORAGE_GROUPS_COLUMNS_GROUP_BY_TITLES[param],
        };
    },
);

export const storageGroupsGroupByParamSchema = z
    .custom<
        GroupsGroupByField | undefined
    >((value) => STORAGE_GROUPS_GROUP_BY_PARAMS.includes(value))
    .catch(undefined);

// Although columns ids mostly similar to backend fields, there might be some difference
// Also for some columns we may use more than one field
export const GROUPS_COLUMNS_TO_DATA_FIELDS: Record<StorageGroupsColumnId, GroupsRequiredField[]> = {
    GroupId: ['GroupId'],
    PoolName: ['PoolName'],
    PileName: ['PileName'],
    // We display MediaType and Encryption in one Type column
    MediaType: ['MediaType', 'Encryption'],
    Erasure: ['Erasure'],
    Used: ['Used'],
    Limit: ['Limit'],
    Usage: ['Usage'],
    DiskSpaceUsage: ['DiskSpaceUsage'],
    DiskSpace: ['State'],
    Read: ['Read'],
    Write: ['Write'],
    Latency: ['Latency'],
    AllocationUnits: ['AllocationUnits'],
    // Read and Write fields make backend to return Whiteboard data
    VDisks: ['VDisk', 'PDisk', 'Read', 'Write'],
    VDisksPDisks: ['VDisk', 'PDisk', 'Read', 'Write'],
    Degraded: ['MissingDisks'],
    State: ['State'],
};

const STORAGE_GROUPS_COLUMNS_TO_SORT_FIELDS: Record<
    StorageGroupsColumnId,
    StorageV2SortValue | undefined
> = {
    GroupId: 'GroupId',
    PoolName: 'PoolName',
    PileName: undefined,
    MediaType: 'MediaType',
    Erasure: 'Erasure',
    Used: 'Used',
    Limit: 'Limit',
    Usage: 'Usage',
    DiskSpaceUsage: 'DiskSpaceUsage',
    DiskSpace: undefined,
    Read: 'Read',
    Write: 'Write',
    Latency: 'Latency',
    AllocationUnits: 'AllocationUnits',
    VDisks: undefined,
    VDisksPDisks: undefined,
    Degraded: 'Degraded',
    State: 'State',
};

export function getStorageGroupsColumnSortField(columnId?: string) {
    return STORAGE_GROUPS_COLUMNS_TO_SORT_FIELDS[columnId as StorageGroupsColumnId];
}

export function isSortableStorageGroupsColumn(columnId: string) {
    return Boolean(getStorageGroupsColumnSortField(columnId));
}
