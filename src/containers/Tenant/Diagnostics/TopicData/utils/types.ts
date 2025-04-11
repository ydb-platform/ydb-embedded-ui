import type {TopicDataFilterValue} from '../../../../../store/reducers/topic/types';
import type {ValueOf} from '../../../../../types/common';

export const TOPIC_DATA_COLUMNS_IDS = {
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
    topicDataFilter?: TopicDataFilterValue;
    startTimestamp?: number;
    selectedOffset?: number;
    database: string;
    path: string;
}
