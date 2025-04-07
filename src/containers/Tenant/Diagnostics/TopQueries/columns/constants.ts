import type {ValueOf} from '../../../../../types/common';

import i18n from './i18n';

export const TOP_QUERIES_COLUMNS_WIDTH_LS_KEY = 'topQueriesColumnsWidth';
export const RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY = 'runningQueriesColumnsWidth';
export const TOP_QUERIES_SELECTED_COLUMNS_LS_KEY = 'topQueriesSelectedColumns';
export const RUNNING_QUERIES_SELECTED_COLUMNS_LS_KEY = 'runningQueriesSelectedColumns';

export const QUERIES_COLUMNS_IDS = {
    CPUTime: 'CPUTime',
    QueryText: 'QueryText',
    EndTime: 'EndTime',
    ReadRows: 'ReadRows',
    ReadBytes: 'ReadBytes',
    UserSID: 'UserSID',
    OneLineQueryText: 'OneLineQueryText',
    QueryHash: 'QueryHash',
    Duration: 'Duration',
    QueryStartAt: 'QueryStartAt',
    ApplicationName: 'ApplicationName',
    RequestUnits: 'RequestUnits',
} as const;
export type QueriesColumnId = ValueOf<typeof QUERIES_COLUMNS_IDS>;

export const DEFAULT_TOP_QUERIES_COLUMNS: QueriesColumnId[] = [
    'QueryHash',
    'CPUTime',
    'QueryText',
    'EndTime',
    'Duration',
    'ReadRows',
    'ReadBytes',
    'RequestUnits',
    'UserSID',
];
export const REQUIRED_TOP_QUERIES_COLUMNS: QueriesColumnId[] = ['CPUTime', 'QueryText'];

export const DEFAULT_RUNNING_QUERIES_COLUMNS: QueriesColumnId[] = [
    'UserSID',
    'QueryStartAt',
    'QueryText',
    'ApplicationName',
];

// Required columns that must always be displayed for running queries
export const REQUIRED_RUNNING_QUERIES_COLUMNS: QueriesColumnId[] = ['QueryStartAt', 'QueryText'];

export const QUERIES_COLUMNS_TITLES: Record<QueriesColumnId, string> = {
    get CPUTime() {
        return i18n('cpu-time');
    },
    get QueryText() {
        return i18n('query-text');
    },
    get EndTime() {
        return i18n('end-time');
    },
    get ReadRows() {
        return i18n('read-rows');
    },
    get ReadBytes() {
        return i18n('read-bytes');
    },
    get UserSID() {
        return i18n('user');
    },
    get OneLineQueryText() {
        return i18n('query-text');
    },
    get QueryHash() {
        return i18n('query-hash');
    },
    get Duration() {
        return i18n('duration');
    },
    get QueryStartAt() {
        return i18n('start-time');
    },
    get ApplicationName() {
        return i18n('application');
    },
    get RequestUnits() {
        return i18n('request-units');
    },
} as const;

const TOP_QUERIES_COLUMNS_TO_SORT_FIELDS: Record<QueriesColumnId, string | undefined> = {
    CPUTime: 'CPUTimeUs',
    QueryText: undefined,
    EndTime: undefined,
    ReadRows: undefined,
    ReadBytes: 'ReadBytes',
    UserSID: undefined,
    OneLineQueryText: undefined,
    QueryHash: undefined,
    Duration: 'Duration',
    QueryStartAt: undefined,
    ApplicationName: undefined,
    RequestUnits: 'RequestUnits',
} as const;

// Define sort fields specifically for running queries
const RUNNING_QUERIES_COLUMNS_TO_SORT_FIELDS: Record<QueriesColumnId, string | undefined> = {
    CPUTime: undefined,
    QueryText: undefined,
    EndTime: undefined,
    ReadRows: undefined,
    ReadBytes: undefined,
    UserSID: 'UserSID',
    OneLineQueryText: undefined,
    QueryHash: undefined,
    Duration: undefined,
    QueryStartAt: 'QueryStartAt',
    ApplicationName: 'ApplicationName',
    RequestUnits: undefined,
} as const;
export function getTopQueriesColumnSortField(columnId?: string) {
    return TOP_QUERIES_COLUMNS_TO_SORT_FIELDS[columnId as QueriesColumnId];
}

export function getRunningQueriesColumnSortField(columnId?: string) {
    return RUNNING_QUERIES_COLUMNS_TO_SORT_FIELDS[columnId as QueriesColumnId];
}

export function isSortableTopQueriesColumn(columnId: string) {
    return Boolean(getTopQueriesColumnSortField(columnId));
}

export function isSortableRunningQueriesColumn(columnId: string) {
    return Boolean(getRunningQueriesColumnSortField(columnId));
}
