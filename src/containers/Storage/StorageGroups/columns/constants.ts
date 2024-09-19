import type {ValueOf} from '../../../../types/common';

import i18n from './i18n';

export const STORAGE_GROUPS_COLUMNS_WIDTH_LS_KEY = 'storageGroupsColumnsWidth';
export const STORAGE_GROUPS_SELECTED_COLUMNS_LS_KEY = 'storageGroupsSelectedColumns';

export const STORAGE_GROUPS_COLUMNS_IDS = {
    PoolName: 'PoolName',
    MediaType: 'MediaType',
    Erasure: 'Erasure',
    GroupId: 'GroupId',
    Used: 'Used',
    Limit: 'Limit',
    Usage: 'Usage',
    DiskSpace: 'DiskSpace',
    Read: 'Read',
    Write: 'Write',
    VDisks: 'VDisks',
    VDisksPDisks: 'VDisksPDisks',
    Degraded: 'Degraded',
} as const;

type StorageGroupsColumnId = ValueOf<typeof STORAGE_GROUPS_COLUMNS_IDS>;

export const DEFAULT_STORAGE_GROUPS_COLUMNS: StorageGroupsColumnId[] = [
    'PoolName',
    'MediaType',
    'Erasure',
    'GroupId',
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
    get DiskSpace() {
        return i18n('space');
    },
    get Read() {
        return i18n('read');
    },
    get Write() {
        return i18n('write');
    },
    get VDisks() {
        return i18n('vdisks');
    },
    get VDisksPDisks() {
        return i18n('vdisks-pdisks');
    },
    get Degraded() {
        return i18n('degraded');
    },
} as const satisfies Record<StorageGroupsColumnId, string>;
