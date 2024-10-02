import type {SelectOption} from '@gravity-ui/uikit';
import {z} from 'zod';

import type {GroupsGroupByField} from '../../../../types/api/storage';
import type {ValueOf} from '../../../../types/common';

import i18n from './i18n';

export const STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY = 'storageGroupsColumnsWidth';
export const STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY = 'storageGroupsSelectedColumns';

export const STORAGE_GROUPS_COLUMNS_IDS = {
    GroupId: 'GroupId',
    PoolName: 'PoolName',
    MediaType: 'MediaType',
    Encryption: 'Encryption',
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
    MissingDisks: 'MissingDisks',
    Degraded: 'Degraded',
    State: 'State',
} as const;

type StorageGroupsColumnId = ValueOf<typeof STORAGE_GROUPS_COLUMNS_IDS>;

export const DEFAULT_STORAGE_GROUPS_COLUMNS: StorageGroupsColumnId[] = [
    'GroupId',
    'PoolName',
    'MediaType',
    'Erasure',
    'Used',
    'Limit',
    'Usage',
    'Read',
    'Write',
    'VDisks',
];

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
    get Encryption() {
        return i18n('encryption');
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
        return i18n('disk-space-usage');
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
    get MissingDisks() {
        return i18n('missing-disks');
    },
    get State() {
        return i18n('state');
    },
} as const satisfies Record<StorageGroupsColumnId, string>;

const STORAGE_GROUPS_GROUP_BY_PARAMS = [
    'PoolName',
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
            content: STORAGE_GROUPS_COLUMNS_TITLES[param],
        };
    },
);

export const storageGroupsGroupByParamSchema = z
    .custom<
        GroupsGroupByField | undefined
    >((value) => STORAGE_GROUPS_GROUP_BY_PARAMS.includes(value))
    .catch(undefined);
