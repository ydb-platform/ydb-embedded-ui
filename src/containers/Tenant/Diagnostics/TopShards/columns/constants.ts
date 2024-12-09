import type {ValueOf} from '../../../../../types/common';

import i18n from './i18n';

export const TOP_SHARDS_COLUMNS_WIDTH_LS_KEY = 'topShardsColumnsWidth';

export const TOP_SHARDS_COLUMNS_IDS = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
} as const;

type TopShardsColumnId = ValueOf<typeof TOP_SHARDS_COLUMNS_IDS>;

export const TOP_SHARDS_COLUMNS_TITLES: Record<TopShardsColumnId, string> = {
    get TabletId() {
        return i18n('tablet-id');
    },
    get CPUCores() {
        return i18n('cpu-cores');
    },
    get DataSize() {
        return i18n('data-size');
    },
    get Path() {
        return i18n('path');
    },
    get NodeId() {
        return i18n('node-id');
    },
    get PeakTime() {
        return i18n('peak-time');
    },
    get InFlightTxCount() {
        return i18n('in-flight-tx-count');
    },
    get IntervalEnd() {
        return i18n('interval-end');
    },
} as const;

const TOP_SHARDS_COLUMNS_TO_SORT_FIELDS: Record<TopShardsColumnId, string | undefined> = {
    TabletId: undefined,
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    Path: undefined,
    NodeId: undefined,
    PeakTime: undefined,
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: undefined,
} as const;

export function getTopShardsColumnSortField(columnId?: string) {
    return TOP_SHARDS_COLUMNS_TO_SORT_FIELDS[columnId as TopShardsColumnId];
}

export function isSortableTopShardsColumn(columnId: string) {
    return Boolean(getTopShardsColumnSortField(columnId));
}
