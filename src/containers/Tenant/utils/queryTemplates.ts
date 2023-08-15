export const createTableTemplate = (path: string) => {
    return `CREATE TABLE \`${path}/my_table\`
(
    \`id\` Uint64,
    \`name\` String,
    PRIMARY KEY (\`id\`)
);`;
};
export const alterTableTemplate = (path: string) => {
    return `ALTER TABLE \`${path}\`
    ADD COLUMN is_deleted Bool;`;
};
export const selectQueryTemplate = (path: string) => {
    return `SELECT *
    FROM \`${path}\`
    LIMIT 10;`;
};
export const upsertQueryTemplate = (path: string) => {
    return `UPSERT INTO \`${path}\`
    ( \`id\`, \`name\` )
VALUES ( );`;
};

export const dropExternalTableTemplate = (path: string) => {
    return `DROP EXTERNAL TABLE \`${path}\`;`;
};

export const createExternalTableTemplate = (path: string) => {
    // Remove data source name from path
    // to create table in the same folder with data source
    const targetPath = path.split('/').slice(0, -1).join('/');

    return `CREATE EXTERNAL TABLE \`${targetPath}/my_external_table\` (
    column1 Int,
    column2 Int
) WITH (
    DATA_SOURCE="${path}",
    LOCATION="",
    FORMAT="json_as_string",
    \`file_pattern\`=""
);`;
};

export const createTopicTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_topic
CREATE TOPIC \`${path}/my_topic\` (
    CONSUMER consumer1,
    CONSUMER consumer2 WITH (read_from = Datetime('2022-12-01T12:13:22Z')) -- Sets up the message write time starting from which the consumer will receive data.
                                                                           -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format). 
                                                                           -- Default value: now
) WITH (
    min_active_partitions = 5, -- Minimum number of topic partitions.
    partition_count_limit = 10, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
    retention_period = Interval('PT12H'), -- Data retention period in the topic. Value type: Interval, default value: 18h.
    retention_storage_mb = 1, -- Limit on the maximum disk space occupied by the topic data. 
                              -- When this value is exceeded, the older data is cleared, like under a retention policy. 
                              -- 0 is interpreted as unlimited.
    partition_write_speed_bytes_per_second = 2097152, -- Maximum allowed write speed per partition.
    partition_write_burst_bytes = 2097152 -- Write quota allocated for write bursts. 
                                          -- When set to zero, the actual write_burst value is equalled to 
                                          -- the quota value (this allows write bursts of up to one second).
);`;
};

export const alterTopicTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/alter_topic
ALTER TOPIC \`${path}\`
    ADD CONSUMER new_consumer WITH (read_from = 0), -- Sets up the message write time starting from which the consumer will receive data.
                                                    -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format).
                                                    -- Default value: now
    ALTER CONSUMER consumer1 SET (read_from = Datetime('2023-12-01T12:13:22Z')),
    DROP CONSUMER consumer2,
    SET (
        min_active_partitions = 10, -- Minimum number of topic partitions.
        partition_count_limit = 15, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
        retention_period = Interval('PT36H'), -- Data retention period in the topic. Value type: Interval, default value: 18h.
        retention_storage_mb = 10, -- Limit on the maximum disk space occupied by the topic data. 
                                   -- When this value is exceeded, the older data is cleared, like under a retention policy. 
                                   -- 0 is interpreted as unlimited.
        partition_write_speed_bytes_per_second = 3145728, -- Maximum allowed write speed per partition.
        partition_write_burst_bytes = 1048576 -- Write quota allocated for write bursts. 
                                              -- When set to zero, the actual write_burst value is equalled to
                                              -- the quota value (this allows write bursts of up to one second).
    );`;
};

export const dropTopicTemplate = (path: string) => {
    return `DROP TOPIC \`${path}\`;`;
};
