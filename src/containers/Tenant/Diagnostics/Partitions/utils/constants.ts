export const PARTITIONS_COLUMNS_IDS = {
    PARTITION_ID: 'partitionId',

    STORE_SIZE: 'storeSize',

    WRITE_SPEED: 'writeSpeed',
    READ_SPEED: 'readSpeed',

    WRITE_LAGS: 'writeLags',
    READ_LAGS: 'readLags',

    UNCOMMITED_MESSAGES: 'uncommitedMessages',
    UNREAD_MESSAGES: 'unreadMessages',

    START_OFFSET: 'startOffset',
    END_OFFSET: 'endOffset',
    COMMITED_OFFSET: 'commitedOffset',

    READ_SESSION_ID: 'readSessionId',
    READER_NAME: 'readerName',

    PARTITION_HOST: 'partitionHost',
    CONNECTION_HOST: 'connectionHost',
} as const;

export const PARTITIONS_COLUMNS_TITILES = {
    [PARTITIONS_COLUMNS_IDS.PARTITION_ID]: 'Partition ID',

    [PARTITIONS_COLUMNS_IDS.STORE_SIZE]: 'Store size',

    [PARTITIONS_COLUMNS_IDS.WRITE_SPEED]: 'Write speed',
    [PARTITIONS_COLUMNS_IDS.READ_SPEED]: 'Read speed',

    [PARTITIONS_COLUMNS_IDS.WRITE_LAGS]: 'Write lags, duration',

    [PARTITIONS_COLUMNS_IDS.READ_LAGS]: 'Read lags, duration',

    [PARTITIONS_COLUMNS_IDS.UNCOMMITED_MESSAGES]: 'Uncommited messages',
    [PARTITIONS_COLUMNS_IDS.UNREAD_MESSAGES]: 'Unread messages',

    [PARTITIONS_COLUMNS_IDS.START_OFFSET]: 'Start offset',
    [PARTITIONS_COLUMNS_IDS.END_OFFSET]: 'End offset',
    [PARTITIONS_COLUMNS_IDS.COMMITED_OFFSET]: 'Commited offset',

    [PARTITIONS_COLUMNS_IDS.READ_SESSION_ID]: 'Read session ID',
    [PARTITIONS_COLUMNS_IDS.READER_NAME]: 'Reader name',

    [PARTITIONS_COLUMNS_IDS.PARTITION_HOST]: 'Partition host',
    [PARTITIONS_COLUMNS_IDS.CONNECTION_HOST]: 'Connection host',
} as const;

export const PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS = {
    PARTITION_WRITE_LAG: 'partitionWriteLag',
    PARTITION_WRITE_IDLE_TIME: 'partitionWriteIdleTime',
} as const;

export const PARTITIONS_WRITE_LAGS_SUB_COLUMNS_TITLES = {
    [PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS.PARTITION_WRITE_LAG]: 'write lag',
    [PARTITIONS_WRITE_LAGS_SUB_COLUMNS_IDS.PARTITION_WRITE_IDLE_TIME]: 'write idle time',
} as const;

export const PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS = {
    CONSUMER_WRITE_LAG: 'consumerWriteLag',
    CONSUMER_READ_LAG: 'consumerReadLag',
    CONSUMER_READ_IDLE_TIME: 'consumerReadIdleTime',
} as const;

export const PARTITIONS_READ_LAGS_SUB_COLUMNS_TITLES = {
    [PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_WRITE_LAG]: 'write lag',
    [PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_READ_LAG]: 'read lag',
    [PARTITIONS_READ_LAGS_SUB_COLUMNS_IDS.CONSUMER_READ_IDLE_TIME]: 'read idle time',
} as const;

// Topics without consumers have partitions data with no data corresponding to consumers
// These columns will be empty and should not be displayed
export const generalPartitionColumnsIds = [
    PARTITIONS_COLUMNS_IDS.PARTITION_ID,
    PARTITIONS_COLUMNS_IDS.STORE_SIZE,
    PARTITIONS_COLUMNS_IDS.WRITE_SPEED,
    PARTITIONS_COLUMNS_IDS.WRITE_LAGS,
    PARTITIONS_COLUMNS_IDS.START_OFFSET,
    PARTITIONS_COLUMNS_IDS.END_OFFSET,
    PARTITIONS_COLUMNS_IDS.PARTITION_HOST,
];

export const allPartitionsColumnsIds = Object.values(PARTITIONS_COLUMNS_IDS);
