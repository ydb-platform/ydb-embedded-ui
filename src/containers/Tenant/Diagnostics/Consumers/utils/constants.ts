export const CONSUMERS_COLUMNS_IDS = {
    CONSUMER: 'consumer',
    READ_SPEED: 'readSpeed',
    READ_LAGS: 'readLags',
} as const;

export const CONSUMERS_COLUMNS_TITILES = {
    [CONSUMERS_COLUMNS_IDS.CONSUMER]: 'Consumer',
    [CONSUMERS_COLUMNS_IDS.READ_SPEED]: 'Read speed',
    [CONSUMERS_COLUMNS_IDS.READ_LAGS]: 'Read lags, duration',
} as const;

export const CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS = {
    WRITE_LAG: 'writeLag',
    READ_LAG: 'readLag',
    READ_IDLE_TIME: 'readIdleTime',
} as const;

export const CONSUMERS_READ_LAGS_SUB_COLUMNS_TITLES = {
    [CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.WRITE_LAG]: 'write lag',
    [CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.READ_LAG]: 'read lag',
    [CONSUMERS_READ_LAGS_SUB_COLUMNS_IDS.READ_IDLE_TIME]: 'read idle time',
} as const;
