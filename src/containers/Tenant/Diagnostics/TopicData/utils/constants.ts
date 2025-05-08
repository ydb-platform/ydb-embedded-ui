import {cn} from '../../../../../utils/cn';
import i18n from '../i18n';

import type {TopicDataColumnId} from './types';

export const b = cn('ydb-diagnostics-topic-data');

export const TOPIC_DATA_COLUMNS_TITLES: Record<TopicDataColumnId, string> = {
    get offset() {
        return i18n('label_offset');
    },
    get partition() {
        return i18n('label_partition');
    },
    get timestampCreate() {
        return i18n('label_timestamp-create');
    },
    get timestampWrite() {
        return i18n('label_timestamp-write');
    },
    get tsDiff() {
        return i18n('label_ts_diff');
    },
    get key() {
        return i18n('label_key');
    },
    get metadata() {
        return i18n('label_metadata');
    },
    get message() {
        return i18n('label_message');
    },
    get size() {
        return i18n('label_size');
    },
    get originalSize() {
        return i18n('label_original-size');
    },
    get codec() {
        return i18n('label_codec');
    },
    get producerID() {
        return i18n('label_producerid');
    },
    get seqNo() {
        return i18n('label_seqno');
    },
} as const;

export const TOPIC_DATA_COLUMNS_WIDTH_LS_KEY = 'topicDataColumnsWidth';
export const TOPIC_DATA_SELECTED_COLUMNS_LS_KEY = 'topicDataSelectedColumns';

export const codecNumberToName: Record<number, string> = {
    0: 'RAW',
    1: 'GZIP',
    2: 'LZOP',
    3: 'ZSTD',
};

export const TOPIC_DATA_FETCH_LIMIT = 20;
