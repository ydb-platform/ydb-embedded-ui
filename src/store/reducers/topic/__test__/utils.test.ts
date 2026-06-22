import {AutoPartitioningStrategy, buildAlterTopicQuery, buildCreateTopicQuery} from '../utils';

describe('topic utils', () => {
    test('buildCreateTopicQuery builds a quoted topic path without retention clauses', () => {
        const query = buildCreateTopicQuery({
            path: 'folder',
            name: 'topic-name',
            shards: 2,
            writeQuotaBytes: 512 * 1024,
            autoPartitioning: {
                enabled: true,
                mode: AutoPartitioningStrategy.ScaleUp,
                minPartitions: 2,
                maxPartitions: 8,
                stabilizationWindow: 300,
                upUtilization: 90,
            },
        });

        expect(query).toContain('CREATE TOPIC `folder/topic-name` WITH (');
        expect(query).toContain('MIN_ACTIVE_PARTITIONS = 2');
        expect(query).toContain('MAX_ACTIVE_PARTITIONS = 8');
        expect(query).not.toContain('RETENTION_PERIOD =');
        expect(query).not.toContain('RETENTION_STORAGE_MB =');
        expect(query).toContain('PARTITION_WRITE_SPEED_BYTES_PER_SECOND = 524288');
        expect(query).toContain("AUTO_PARTITIONING_STRATEGY = 'scale_up'");
        expect(query).toContain("AUTO_PARTITIONING_STABILIZATION_WINDOW = Interval('PT300S')");
        expect(query).toContain('AUTO_PARTITIONING_UP_UTILIZATION_PERCENT = 90');
        expect(query).toMatch(/\n\);$/);
    });

    test('buildAlterTopicQuery preserves partition limit without retention clauses', () => {
        const query = buildAlterTopicQuery({
            name: 'topic',
            shards: 3,
            partitionCountLimit: 10,
            writeQuotaBytes: 1024 * 1024,
            preservePartitionCountLimit: true,
            autoPartitioning: {
                enabled: false,
                mode: AutoPartitioningStrategy.ScaleUpAndDown,
            },
        });

        expect(query).toContain('ALTER TOPIC topic SET (');
        expect(query).toContain('MIN_ACTIVE_PARTITIONS = 3');
        expect(query).toContain('PARTITION_COUNT_LIMIT = 10');
        expect(query).not.toContain('RETENTION_PERIOD =');
        expect(query).not.toContain('RETENTION_STORAGE_MB =');
        expect(query).not.toContain('AUTO_PARTITIONING_STRATEGY =');
        expect(query).not.toContain('MAX_ACTIVE_PARTITIONS =');
    });
});
