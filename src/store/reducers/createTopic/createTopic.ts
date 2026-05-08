import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {api} from '../api';

export type CreateTopicMeteringMode = 'reserved-capacity' | 'request-units' | 'unspecified';

export type CreateTopicAutoPartitioningStrategy = 'scale-up' | 'scale-up-and-down' | 'paused';

export interface CreateTopicAutoPartitioning {
    enabled: boolean;
    mode: CreateTopicAutoPartitioningStrategy;
    minPartitions?: number;
    maxPartitions?: number;
    stabilizationWindow?: number;
    upUtilization?: number;
    downUtilization?: number;
}

export interface CreateTopicParams {
    database: string;
    path?: string;
    name: string;
    shards: number;
    writeQuota: number;
    retentionHours: number;
    storageLimitMb: number;
    meterMode: CreateTopicMeteringMode;
    retentionType: 'time' | 'size';
    autoPartitioning: CreateTopicAutoPartitioning;
}

const METERING_MODE_VALUE: Record<Exclude<CreateTopicMeteringMode, 'unspecified'>, string> = {
    'reserved-capacity': 'RESERVED_CAPACITY',
    'request-units': 'REQUEST_UNITS',
};

const AUTO_PARTITIONING_STRATEGY_VALUE: Record<CreateTopicAutoPartitioningStrategy, string> = {
    'scale-up': 'scale_up',
    'scale-up-and-down': 'scale_up_and_down',
    paused: 'paused',
};

function escapeBackticks(value: string) {
    return value.replace(/`/g, '``');
}

function buildTopicRef(path: string | undefined, name: string) {
    const fullPath = path
        ? `${escapeBackticks(path)}/${escapeBackticks(name)}`
        : escapeBackticks(name);
    return `\`${fullPath}\``;
}

export function buildCreateTopicQuery(params: CreateTopicParams) {
    const {
        path,
        name,
        shards,
        writeQuota,
        retentionHours,
        retentionType,
        storageLimitMb,
        meterMode,
        autoPartitioning,
    } = params;

    const settings: string[] = [];

    if (autoPartitioning.enabled) {
        settings.push(`min_active_partitions = ${autoPartitioning.minPartitions ?? shards}`);
        settings.push(`partition_count_limit = ${autoPartitioning.maxPartitions ?? 0}`);
    } else {
        settings.push(`min_active_partitions = ${shards}`);
        settings.push(`partition_count_limit = ${shards}`);
    }

    const effectiveStorageLimitMb = retentionType === 'time' ? 0 : storageLimitMb;
    settings.push(`retention_period = Interval('PT${retentionHours}H')`);
    settings.push(`retention_storage_mb = ${effectiveStorageLimitMb}`);
    settings.push(`partition_write_speed_bytes_per_second = ${writeQuota}`);

    if (meterMode !== 'unspecified') {
        settings.push(`metering_mode = '${METERING_MODE_VALUE[meterMode]}'`);
    }

    if (autoPartitioning.enabled) {
        settings.push(
            `auto_partitioning_strategy = '${AUTO_PARTITIONING_STRATEGY_VALUE[autoPartitioning.mode]}'`,
        );
        if (autoPartitioning.stabilizationWindow !== undefined) {
            settings.push(
                `auto_partitioning_stabilization_window = Interval('PT${autoPartitioning.stabilizationWindow}S')`,
            );
        }
        if (autoPartitioning.upUtilization !== undefined) {
            settings.push(
                `auto_partitioning_up_utilization_percent = ${autoPartitioning.upUtilization}`,
            );
        }
        if (autoPartitioning.downUtilization !== undefined) {
            settings.push(
                `auto_partitioning_down_utilization_percent = ${autoPartitioning.downUtilization}`,
            );
        }
    }

    return `CREATE TOPIC ${buildTopicRef(path, name)} WITH (\n    ${settings.join(',\n    ')}\n);`;
}

export const createTopicApi = api.injectEndpoints({
    endpoints: (build) => ({
        createTopic: build.mutation({
            queryFn: async (params: CreateTopicParams) => {
                try {
                    const query = buildCreateTopicQuery(params);

                    const response = await window.api.viewer.sendQuery({
                        query,
                        database: params.database,
                        action: 'execute-query',
                    });

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    const data = parseQueryAPIResponse(response);
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['All']),
        }),
    }),
    overrideExisting: 'throw',
});
