import {createEnumParam, withDefault} from 'use-query-params';

import type {ValueOf} from '../../../../../types/common';
import i18n from '../i18n';

export const TOPIC_DATA_COLUMNS_IDS = {
    PARTITION: 'partition',
    OFFSET: 'offset',
    TIMESTAMP_CREATE: 'timestampCreate',
    TIMESTAMP_WRITE: 'timestampWrite',
    TS_DIFF: 'tsDiff',
    KEY: 'key',
    METADATA: 'metadata',
    MESSAGE: 'message',
    SIZE: 'size',
    ORIGINAL_SIZE: 'originalSize',
    CODEC: 'codec',
    PRODUCERID: 'producerID',
    SEQNO: 'seqNo',
} as const;

export type TopicDataColumnId = ValueOf<typeof TOPIC_DATA_COLUMNS_IDS>;

export interface TopicDataFilters {
    partition?: string;
    database: string;
    path: string;
    isEmpty: boolean;
}

export const TopicDataFilterValues = {
    get TIMESTAMP() {
        return i18n('label_by-timestamp');
    },
    get OFFSET() {
        return i18n('label_by-offset');
    },
};

export type TopicDataFilterValue = keyof typeof TopicDataFilterValues;

export const isValidTopicDataFilterValue = (value: string): value is TopicDataFilterValue => {
    return Object.keys(TopicDataFilterValues).some((v) => v === value);
};

export const TopicDataFilterValueEnum = createEnumParam(['TIMESTAMP', 'OFFSET']);
export const TopicDataFilterValueParam = withDefault<
    TopicDataFilterValue | undefined | null,
    'TIMESTAMP'
>(TopicDataFilterValueEnum, 'TIMESTAMP');
