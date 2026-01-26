export const DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export const READ_REPLICAS_MODE = {
    PER_AZ: 'PER_AZ',
    ANY_AZ: 'ANY_AZ',
} as const;
