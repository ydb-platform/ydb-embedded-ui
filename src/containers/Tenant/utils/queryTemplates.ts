export const createTableTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_table
CREATE TABLE \`${path}/ydb_row_table\` (
    category_id Uint64 NOT NULL,
    id Uint64,
    expire_at Datetime,
    updated_on Datetime,
    name Text,
    \`binary-payload\` Bytes,
    attributes JsonDocument,
    -- uncomment to add a secondary index
    -- INDEX idx_row_table_id GLOBAL SYNC ON ( id ) COVER ( name, attributes ), -- Secondary indexes docs https://ydb.tech/en/docs/yql/reference/syntax/create_table#secondary_index
    PRIMARY KEY (category_id, id)
) 
WITH (
    AUTO_PARTITIONING_BY_SIZE = ENABLED,
    AUTO_PARTITIONING_PARTITION_SIZE_MB = 2048,
    AUTO_PARTITIONING_BY_LOAD = ENABLED,
    AUTO_PARTITIONING_MIN_PARTITIONS_COUNT = 4,
    AUTO_PARTITIONING_MAX_PARTITIONS_COUNT = 1024
    -- uncomment to create a table with predefined partitions
    -- , UNIFORM_PARTITIONS = 4 -- The number of partitions for uniform initial table partitioning.
                            -- The primary key's first column must have type Uint64 or Uint32.
                            -- A created table is immediately divided into the specified number of partitions
    -- uncomment to launch read only replicas in every AZ
    -- , READ_REPLICAS_SETTINGS = 'PER_AZ:1' -- Enable read replicas for stale read, launch one replica in every availability zone
    -- uncomment to enable ttl
    -- , TTL = Interval("PT1H") ON expire_at -- Enable background deletion of expired rows https://ydb.tech/en/docs/concepts/ttl
    -- uncomment to create a table with a bloom filter
    -- , KEY_BLOOM_FILTER = ENABLED -- With a Bloom filter, you can more efficiently determine
                               -- if some keys are missing in a table when making multiple single queries by the primary key.
)`;
};
export const createColumnTableTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_table#olap-tables
CREATE TABLE \`${path}/ydb_column_table\` (
    id Int64 NOT NULL,
    author Text,
    title Text,
    body Text,
    PRIMARY KEY (id)
)
PARTITION BY HASH(id)
WITH (STORE = COLUMN)`;
};
export const createAsyncReplicationTemplate = () => {
    return `CREATE OBJECT secret_name (TYPE SECRET) WITH value="secret_value";

CREATE ASYNC REPLICATION my_replication
FOR \`/remote_database/table_name\` AS \`local_table_name\` --[, \`/remote_database/another_table_name\` AS \`another_local_table_name\` ...]
WITH (
    CONNECTION_STRING="grpcs://mydb.ydb.tech:2135/?database=/remote_database",
    TOKEN_SECRET_NAME = "secret_name"
    -- ENDPOINT="mydb.ydb.tech:2135",
    -- DATABASE=\`/remote_database\`,
    -- USER="user",
    -- PASSWORD_SECRET_NAME="your_password"
);`;
};
export const alterTableTemplate = (path: string) => {
    return `ALTER TABLE \`${path}\`
    ADD COLUMN numeric_column Int32;`;
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
    CONSUMER consumer2 WITH (read_from = Datetime('1970-01-01T00:00:00Z')) -- Sets up the message write time starting from which the consumer will receive data.
                                                                           -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format). 
                                                                           -- Default value: now
) WITH (
    min_active_partitions = 1, -- Minimum number of topic partitions.
    partition_count_limit = 0, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
    retention_period = Interval('PT18H'), -- Data retention period in the topic. Value type: Interval.
    retention_storage_mb = 0, -- Limit on the maximum disk space occupied by the topic data. 
                              -- When this value is exceeded, the older data is cleared, like under a retention policy. 
                              -- 0 is interpreted as unlimited.
    partition_write_speed_bytes_per_second = 1048576, -- Maximum allowed write speed per partition.
    partition_write_burst_bytes = 0 -- Write quota allocated for write bursts. 
                                    -- When set to zero, the actual write_burst value is equalled to 
                                    -- the quota value (this allows write bursts of up to one second).
);`;
};

export const alterTopicTemplate = (path: string) => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/alter_topic
ALTER TOPIC \`${path}\`
    ADD CONSUMER new_consumer WITH (read_from = Datetime('1970-01-01T00:00:00Z')), -- Sets up the message write time starting from which the consumer will receive data.
                                                                                   -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format).
                                                                                   -- Default value: now
    ALTER CONSUMER consumer1 SET (read_from = Datetime('1970-01-01T00:00:00Z')),
    DROP CONSUMER consumer2,
    SET (
        min_active_partitions = 1, -- Minimum number of topic partitions.
        partition_count_limit = 0, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
        retention_period = Interval('PT18H'), -- Data retention period in the topic. Value type: Interval.
        retention_storage_mb = 0, -- Limit on the maximum disk space occupied by the topic data. 
                                  -- When this value is exceeded, the older data is cleared, like under a retention policy. 
                                  -- 0 is interpreted as unlimited.
        partition_write_speed_bytes_per_second = 1048576, -- Maximum allowed write speed per partition.
        partition_write_burst_bytes = 0 -- Write quota allocated for write bursts. 
                                        -- When set to zero, the actual write_burst value is equalled to
                                        -- the quota value (this allows write bursts of up to one second).
    );`;
};

export const dropTopicTemplate = (path: string) => {
    return `DROP TOPIC \`${path}\`;`;
};

export const createViewTemplate = (path: string) => {
    return `CREATE VIEW \`${path}/my_view\` WITH (security_invoker = TRUE) AS SELECT 1;`;
};

export const dropViewTemplate = (path: string) => {
    return `DROP VIEW \`${path}\`;`;
};
export const dropAsyncReplicationTemplate = (path: string) => {
    return `DROP ASYNC REPLICATION \`${path}\`;`;
};

export const alterAsyncReplicationTemplate = (path: string) => {
    return `ALTER ASYNC REPLICATION \`${path}\` SET (STATE = "DONE", FAILOVER_MODE = "FORCE");`;
};
