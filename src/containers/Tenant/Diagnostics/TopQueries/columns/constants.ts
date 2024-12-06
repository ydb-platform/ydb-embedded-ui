import type {ValueOf} from '../../../../../types/common';

import i18n from './i18n';

export const TOP_QUERIES_COLUMNS_WIDTH_LS_KEY = 'topQueriesColumnsWidth';
export const RUNNING_QUERIES_COLUMNS_WIDTH_LS_KEY = 'runningQueriesColumnsWidth';

export const TOP_QUERIES_COLUMNS_IDS = {
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
} as const;

type TopQueriesColumnId = ValueOf<typeof TOP_QUERIES_COLUMNS_IDS>;

export const TOP_QUERIES_COLUMNS_TITLES: Record<TopQueriesColumnId, string> = {
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
} as const;

const TOP_QUERIES_COLUMNS_TO_SORT_FIELDS: Record<TopQueriesColumnId, string | undefined> = {
    CPUTime: 'CPUTimeUs',
    QueryText: undefined,
    EndTime: 'EndTime',
    ReadRows: 'ReadRows',
    ReadBytes: 'ReadBytes',
    UserSID: 'UserSID',
    OneLineQueryText: undefined,
    QueryHash: undefined,
    Duration: 'Duration',
    QueryStartAt: 'QueryStartAt',
    ApplicationName: 'ApplicationName',
} as const;

export function getTopQueriesColumnSortField(columnId?: string) {
    return TOP_QUERIES_COLUMNS_TO_SORT_FIELDS[columnId as TopQueriesColumnId];
}

export function isSortableTopQueriesColumn(columnId: string) {
    return Boolean(getTopQueriesColumnSortField(columnId));
}
