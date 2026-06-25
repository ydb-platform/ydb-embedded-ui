export enum AutoPartitioningStrategy {
    Disabled = 'AUTO_PARTITIONING_STRATEGY_DISABLED',
    Unspecified = 'AUTO_PARTITIONING_STRATEGY_UNSPECIFIED',
    Paused = 'AUTO_PARTITIONING_STRATEGY_PAUSED',
    ScaleUp = 'AUTO_PARTITIONING_STRATEGY_SCALE_UP',
    ScaleUpAndDown = 'AUTO_PARTITIONING_STRATEGY_SCALE_UP_AND_DOWN',
}

export interface TopicFormValues {
    path?: string;
    name?: string;
    shards: number;
    partitionCountLimit?: number;
    writeQuotaBytes: number;
    preservePartitionCountLimit?: boolean;
    autoPartitioning: {
        enabled: boolean;
        mode: string;
        minPartitions?: number;
        maxPartitions?: number;
        stabilizationWindow?: number;
        upUtilization?: number;
    };
}

const AUTO_PARTITIONING_STRATEGY_TO_YQL: Record<AutoPartitioningStrategy, string> = {
    [AutoPartitioningStrategy.Disabled]: 'disabled',
    [AutoPartitioningStrategy.Unspecified]: 'unspecified',
    [AutoPartitioningStrategy.Paused]: 'paused',
    [AutoPartitioningStrategy.ScaleUp]: 'scale_up',
    [AutoPartitioningStrategy.ScaleUpAndDown]: 'scale_up_and_down',
};

const NAME_REGEX = /^[a-z_][a-z0-9_]*$/i;

function prepareTopicEntityName(path: string) {
    return NAME_REGEX.test(path)
        ? path
        : `\`${path.replaceAll('\\', '\\\\').replaceAll('`', '\\`')}\``;
}

function buildTopicPath(path: string | undefined, name: string | undefined) {
    const topicPath = [path, name].filter(Boolean).join('/');
    if (topicPath) {
        return prepareTopicEntityName(topicPath);
    }
    throw new Error('Topic name or path is required');
}

function formatAutoPartitioningStrategy(strategy: string) {
    return (
        AUTO_PARTITIONING_STRATEGY_TO_YQL[strategy as AutoPartitioningStrategy] ??
        strategy.replace(/^AUTO_PARTITIONING_STRATEGY_/, '').toLowerCase()
    );
}

function buildTopicSettings(
    formData: TopicFormValues,
    {
        includeDisabledAutoPartitioningStrategy = true,
    }: {includeDisabledAutoPartitioningStrategy?: boolean} = {},
): string[] {
    const {
        shards,
        writeQuotaBytes,
        partitionCountLimit,
        preservePartitionCountLimit,
        autoPartitioning,
    } = formData;

    const settings: string[] = [];

    const minActivePartitions = autoPartitioning.enabled
        ? (autoPartitioning.minPartitions ?? shards)
        : shards;
    settings.push(`MIN_ACTIVE_PARTITIONS = ${minActivePartitions}`);

    if (autoPartitioning.enabled) {
        if (autoPartitioning.maxPartitions !== undefined) {
            settings.push(`MAX_ACTIVE_PARTITIONS = ${autoPartitioning.maxPartitions}`);
        }
    } else {
        if (preservePartitionCountLimit) {
            if (partitionCountLimit !== undefined) {
                settings.push(`PARTITION_COUNT_LIMIT = ${partitionCountLimit}`);
            }
        } else {
            settings.push(`PARTITION_COUNT_LIMIT = ${shards}`);
        }
    }

    settings.push(`PARTITION_WRITE_SPEED_BYTES_PER_SECOND = ${writeQuotaBytes}`);

    if (autoPartitioning.enabled || includeDisabledAutoPartitioningStrategy) {
        const strategy = autoPartitioning.enabled
            ? formatAutoPartitioningStrategy(autoPartitioning.mode)
            : formatAutoPartitioningStrategy(AutoPartitioningStrategy.Disabled);
        settings.push(`AUTO_PARTITIONING_STRATEGY = '${strategy}'`);
    }

    if (autoPartitioning.enabled) {
        if (autoPartitioning.stabilizationWindow !== undefined) {
            settings.push(
                `AUTO_PARTITIONING_STABILIZATION_WINDOW = Interval('PT${autoPartitioning.stabilizationWindow}S')`,
            );
        }
        if (autoPartitioning.upUtilization !== undefined) {
            settings.push(
                `AUTO_PARTITIONING_UP_UTILIZATION_PERCENT = ${autoPartitioning.upUtilization}`,
            );
        }
    }

    return settings;
}

export function buildCreateTopicQuery(formData: TopicFormValues): string {
    const topicRef = buildTopicPath(formData.path, formData.name);
    const settings = buildTopicSettings(formData);
    return `CREATE TOPIC ${topicRef} WITH (\n    ${settings.join(',\n    ')}\n);`;
}

export function buildAlterTopicQuery(formData: TopicFormValues): string {
    const topicRef = buildTopicPath(formData.path, formData.name);
    const settings = buildTopicSettings(formData, {
        includeDisabledAutoPartitioningStrategy: false,
    });
    return `ALTER TOPIC ${topicRef} SET (\n    ${settings.join(',\n    ')}\n);`;
}
