export const createTableTemplate = () => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_table
CREATE TABLE \`$path\` (
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
    AUTO_PARTITIONING_BY_SIZE=\`$autoPartitioningBySize\`,
    AUTO_PARTITIONING_PARTITION_SIZE_MB=\`$autoPartitioningPartitionSizeMb\`,
    AUTO_PARTITIONING_BY_LOAD=\`$autoPartitioningByLoad\`,
    AUTO_PARTITIONING_MIN_PARTITIONS_COUNT=\`$autoPartitioningMinPartitionsCount\`,
    AUTO_PARTITIONING_MAX_PARTITIONS_COUNT=\`$autoPartitioningMaxPartitionsCount\`
    -- uncomment to create a table with predefined partitions
    -- , UNIFORM_PARTITIONS=\`$uniformPartitions\` -- The number of partitions for uniform initial table partitioning.
                            -- The primary key's first column must have type Uint64 or Uint32.
                            -- A created table is immediately divided into the specified number of partitions
    -- uncomment to launch read only replicas in every AZ
    -- , READ_REPLICAS_SETTINGS=\`$readReplicasSettings\` -- Enable read replicas for stale read, launch one replica in every availability zone
    -- uncomment to enable ttl
    -- , TTL=\`$ttl\` ON expire_at -- Enable background deletion of expired rows https://ydb.tech/en/docs/concepts/ttl
    -- uncomment to create a table with a bloom filter
    -- , KEY_BLOOM_FILTER=\`$keyBloomFilter\` -- With a Bloom filter, you can more efficiently determine
                               -- if some keys are missing in a table when making multiple single queries by the primary key.
)`;
};

export const createColumnTableTemplate = () => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_table#olap-tables
CREATE TABLE \`$path\` (
    id Int64 NOT NULL,
    author Text,
    title Text,
    body Text,
    PRIMARY KEY (id)
)
PARTITION BY HASH(id)
WITH (STORE=\`$store\`)`;
};

export const deleteRowsTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/delete
DELETE FROM $path
WHERE Key1 == $key1 AND Key2 >= $key2;`;
};

export const updateTableTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/update
UPDATE my_table
SET Value1 = YQL::ToString($value2 + 1), Value2 = $value2 - 1
WHERE Key1 > $key1;`;
};

export const createUserTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create-user
CREATE USER $user_name [option]
-- user_name: The name of the user. It may contain lowercase Latin letters and digits.
-- option: The password of the user:
    -- PASSWORD 'password' creates a user with the password password. The ENCRYPTED option is always enabled.
    -- PASSWORD NULL creates a user with an empty password.`;
};

export const createGroupTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create-group
CREATE GROUP $group_name
-- group_name: The name of the group. It may contain lowercase Latin letters and digits.`;
};

export const createAsyncReplicationTemplate = () => {
    return `CREATE OBJECT secret_name (TYPE SECRET) WITH value=\`$secretValue\`;

CREATE ASYNC REPLICATION my_replication
FOR \`$remotePath\` AS \`$localTableName\` --[, \`$anotherRemotePath\` AS \`$anotherLocalTableName\` ...]
WITH (
    CONNECTION_STRING=\`$connectionString\`,
    TOKEN_SECRET_NAME=\`$tokenSecretName\`
    -- ENDPOINT=\`$endpoint\`,
    -- DATABASE=\`$database\`,
    -- USER=\`$user\`,
    -- PASSWORD_SECRET_NAME=\`$passwordSecretName\`
);`;
};

export const alterTableTemplate = () => {
    return `ALTER TABLE \`$path\`
    ADD COLUMN numeric_column Int32;`;
};

export const selectQueryTemplate = () => {
    return `SELECT *
    FROM \`$path\`
    LIMIT 10;`;
};

export const upsertQueryTemplate = () => {
    return `UPSERT INTO \`$path\`
    ( \`id\`, \`name\` )
VALUES ( );`;
};

export const dropExternalTableTemplate = () => {
    return `DROP EXTERNAL TABLE \`$path\`;`;
};

export const dropUserTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/drop-user
DROP USER [ IF EXISTS ] $user_name [, ...]

-- IF EXISTS: Suppress an error if the user doesn't exist.
-- user_name: The name of the user to be deleted.`;
};

export const dropGroupTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/drop-group
DROP GROUP [ IF EXISTS ] $group_name [, ...]

-- IF EXISTS: Suppress an error if the group doesn't exist.
-- group_name: The name of the group to be deleted.`;
};

export const createCdcStreamTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create_changefeed
ADD CHANGEFEED $name WITH (
    MODE = $mode, -- KEYS_ONLY, UPDATES, NEW_IMAGE, OLD_IMAGE, or NEW_AND_OLD_IMAGES
    FORMAT = $format, -- JSON or DEBEZIUM_JSON
    VIRTUAL_TIMESTAMPS = $virtualTimestamps, -- true or false
    RETENTION_PERIOD = $retentionPeriod, -- Interval value, e.g., Interval('PT24H')
    TOPIC_MIN_ACTIVE_PARTITIONS = $topicMinActivePartitions,
    INITIAL_SCAN = $initialScan -- true or false
)

-- MODE options:
--   KEYS_ONLY: Only the primary key components and change flag are written.
--   UPDATES: Updated column values that result from updates are written.
--   NEW_IMAGE: Any column values resulting from updates are written.
--   OLD_IMAGE: Any column values before updates are written.
--   NEW_AND_OLD_IMAGES: A combination of NEW_IMAGE and OLD_IMAGE modes.`;
};

export const grantPrivilegeTemplate = () => {
    return `
GRANT $permission_name [, ...] | ALL [PRIVILEGES]
ON $path_to_scheme_object [, ...]
TO $role_name [, ...]
[WITH GRANT OPTION]

-- permission_name: The name of the access right to schema objects that needs to be assigned.
-- path_to_scheme_object: The path to the schema object for which rights are being granted.
-- role_name: The name of the user or group to whom rights on the schema object are being granted.
-- WITH GRANT OPTION: Using this construct gives the user or group of users the right to manage access rights - 
--                    to assign or revoke certain rights. This construct has functionality similar to granting 
--                    the "ydb.access.grant" or GRANT right. A subject with the ydb.access.grant right cannot 
--                    grant rights broader than they possess themselves.`;
};

export const revokePrivilegeTemplate = () => {
    return `
REVOKE [GRANT OPTION FOR] $permission_name [, ...] | ALL [PRIVILEGES]
ON $path_to_scheme_object [, ...]
FROM $role_name [, ...]

-- permission_name: The name of the access right to schema objects that needs to be revoked.
-- path_to_scheme_object: The path to the schema object from which rights are being revoked.
-- role_name: The name of the user or group from whom rights on the schema object are being revoked.
-- GRANT OPTION FOR: Using this construct revokes the user's or group's right to manage access rights.
--                   All previously granted rights by this user remain in effect.
--                   This construct has functionality similar to revoking the "ydb.access.grant" or GRANT right.`;
};

export const createExternalTableTemplate = () => {
    return `CREATE EXTERNAL TABLE \`$path\` (
    column1 Int,
    column2 Int
) WITH (
    DATA_SOURCE=\`$dataSource\`,
    LOCATION=\`$location\`,
    FORMAT=\`$format\`,
    \`file_pattern\`=\`$filePattern\`
);`;
};

export const createTopicTemplate = () => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_topic
CREATE TOPIC \`$path\` (
    CONSUMER consumer1,
    CONSUMER consumer2 WITH (read_from=\`$readFrom\`) -- Sets up the message write time starting from which the consumer will receive data.
                                                     -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format). 
                                                     -- Default value: now
) WITH (
    min_active_partitions=\`$minActivePartitions\`, -- Minimum number of topic partitions.
    partition_count_limit=\`$partitionCountLimit\`, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
    retention_period=\`$retentionPeriod\`, -- Data retention period in the topic. Value type: Interval.
    retention_storage_mb=\`$retentionStorageMb\`, -- Limit on the maximum disk space occupied by the topic data. 
                                                 -- When this value is exceeded, the older data is cleared, like under a retention policy. 
                                                 -- 0 is interpreted as unlimited.
    partition_write_speed_bytes_per_second=\`$partitionWriteSpeedBytesPerSecond\`, -- Maximum allowed write speed per partition.
    partition_write_burst_bytes=\`$partitionWriteBurstBytes\` -- Write quota allocated for write bursts. 
                                                             -- When set to zero, the actual write_burst value is equalled to 
                                                             -- the quota value (this allows write bursts of up to one second).
);`;
};

export const alterTopicTemplate = () => {
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/alter_topic
ALTER TOPIC \`$path\`
    ADD CONSUMER new_consumer WITH (read_from=\`$readFrom\`), -- Sets up the message write time starting from which the consumer will receive data.
                                                             -- Value type: Datetime OR Timestamp OR integer (unix-timestamp in the numeric format).
                                                             -- Default value: now
    ALTER CONSUMER consumer1 SET (read_from=\`$readFrom\`),
    DROP CONSUMER consumer2,
    SET (
        min_active_partitions=\`$minActivePartitions\`, -- Minimum number of topic partitions.
        partition_count_limit=\`$partitionCountLimit\`, -- Maximum number of active partitions in the topic. 0 is interpreted as unlimited.
        retention_period=\`$retentionPeriod\`, -- Data retention period in the topic. Value type: Interval.
        retention_storage_mb=\`$retentionStorageMb\`, -- Limit on the maximum disk space occupied by the topic data. 
                                                     -- When this value is exceeded, the older data is cleared, like under a retention policy. 
                                                     -- 0 is interpreted as unlimited.
        partition_write_speed_bytes_per_second=\`$partitionWriteSpeedBytesPerSecond\`, -- Maximum allowed write speed per partition.
        partition_write_burst_bytes=\`$partitionWriteBurstBytes\` -- Write quota allocated for write bursts. 
                                                                 -- When set to zero, the actual write_burst value is equalled to
                                                                 -- the quota value (this allows write bursts of up to one second).
    );`;
};

export const dropTopicTemplate = () => {
    return `DROP TOPIC \`$path\`;`;
};

export const createViewTemplate = () => {
    return `CREATE VIEW \`$path\` WITH (security_invoker=\`$securityInvoker\`) AS SELECT 1;`;
};

export const dropTableTemplate = () => {
    return `DROP TABLE \`$path\`;`;
};

export const dropAsyncReplicationTemplate = () => {
    return `DROP ASYNC REPLICATION \`$path\`;`;
};

export const alterAsyncReplicationTemplate = () => {
    return `ALTER ASYNC REPLICATION \`$path\` SET (STATE=\`$state\`, FAILOVER_MODE=\`$failoverMode\`);`;
};

export const addTableIndex = () => {
    return `ALTER TABLE \`$path\` ADD INDEX \`$indexName\` GLOBAL ON (\`$columnName\`);`;
};

export const dropTableIndex = () => {
    return `ALTER TABLE \`$path\` DROP INDEX \`$indexName\`;`;
};
