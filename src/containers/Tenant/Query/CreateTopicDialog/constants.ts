import type {
    CreateTopicAutoPartitioningStrategy,
    CreateTopicMeteringMode,
} from '../../../../store/reducers/createTopic/createTopic';

import type {CreateTopicFormValues} from './schema';

export const CREATE_TOPIC_DIALOG = 'create-topic-dialog';

export const RETENTION_TYPES = ['time', 'size'] as const;
export type RetentionType = (typeof RETENTION_TYPES)[number];

export const AUTO_PARTITIONING_MODES = ['scale-up', 'paused'] as const;
export type AutoPartitioningMode = CreateTopicAutoPartitioningStrategy;

export const WRITE_QUOTAS_KB = [128, 512, 1024] as const;
export const RETENTION_HOURS_OPTIONS = [1, 4, 12, 24] as const;

export const DEFAULT_METER_MODE: CreateTopicMeteringMode = 'unspecified';

export const STORAGE_LIMIT_MIN_GB = 50;
export const STORAGE_LIMIT_MAX_GB = 400;
export const STORAGE_LIMIT_STEP_GB = 1;
export const MB_PER_GB = 1024;

export const DEFAULT_CREATE_TOPIC_VALUES: CreateTopicFormValues = {
    name: '',
    shards: 1,
    writeQuota: 1024,
    retentionType: 'time',
    retentionHours: 4,
    storageLimitMb: STORAGE_LIMIT_MIN_GB * MB_PER_GB,
    autoPartitioning: {
        enabled: false,
        mode: 'scale-up',
        minPartitions: 1,
        maxPartitions: 2,
        stabilizationWindow: 300,
        upUtilization: 90,
        downUtilization: 30,
    },
};
