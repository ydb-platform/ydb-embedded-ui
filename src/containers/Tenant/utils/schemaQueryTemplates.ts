import type {SchemaData} from '../Schema/SchemaViewer/types';

export interface SchemaQueryParams {
    path: string;
    relativePath: string;
    tableData?: SchemaData[];
}

export type TemplateFn = (params?: SchemaQueryParams) => string;

export const createTableTemplate = (params?: SchemaQueryParams) => {
    const tableName = params?.relativePath
        ? `\`${params?.relativePath}/my_row_table\``
        : '${1:my_row_table}';
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_table
CREATE TABLE ${tableName} (
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
export const createColumnTableTemplate = (params?: SchemaQueryParams) => {
    const tableName = params?.relativePath
        ? `\`${params?.relativePath}/my_column_table\``
        : '${1:my_column_table}';
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/create_table#olap-tables
CREATE TABLE ${tableName} (
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
FOR \${1:<table_name>} AS \${2:local_table_name} --[, \`/remote_database/another_table_name\` AS \`another_local_table_name\` ...]
WITH (
    CONNECTION_STRING="grpcs://mydb.ydb.tech:2135/?database=/\${3:<remote_database>}",
    TOKEN_SECRET_NAME = "secret_name"
    -- ENDPOINT="mydb.ydb.tech:2135",
    -- DATABASE=\`\${3:/remote_database}\`,
    -- USER="user",
    -- PASSWORD_SECRET_NAME="your_password"
);`;
};
export const alterTableTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';

    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/alter_table/

ALTER TABLE ${path}
    -- RENAME TO new_table_name
    -- DROP COLUMN some_existing_column
    ADD COLUMN numeric_column Int32;`;
};
export const selectQueryTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    const columns = params?.tableData?.map((column) => '`' + column.name + '`').join(', ') || '*';

    return `SELECT ${columns}
    FROM ${path}
    LIMIT 10;`;
};
export const upsertQueryTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    const columns =
        params?.tableData?.map((column) => `\`${column.name}\``).join(', ') || `id, name`;

    return `UPSERT INTO ${path}
    ( ${columns} )
VALUES ( );`;
};

export const dropExternalTableTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:my_table}';
    return `DROP EXTERNAL TABLE ${path};`;
};

export const createExternalTableTemplate = (params?: SchemaQueryParams) => {
    // Remove data source name from path
    // to create table in the same folder with data source
    const targetPath = params?.relativePath.split('/').slice(0, -1).join('/');

    const target = targetPath ? `\`${targetPath}/my_external_table\`` : '${1:<my_external_table>}';

    const source = params?.relativePath ? `${params.relativePath}` : '${2:<path_to_data_source>}';
    return `CREATE EXTERNAL TABLE ${target} (
    column1 Int,
    column2 Int
) WITH (
    DATA_SOURCE="${source}",
    LOCATION="",
    FORMAT="json_as_string",
    \`file_pattern\`=""
);`;
};

export const createTopicTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`/my_topic` : '${1:my_topic}';
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create-topic
CREATE TOPIC ${path} (
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

export const alterTopicTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_topic>}';
    return `-- docs: https://ydb.tech/en/docs/yql/reference/syntax/alter_topic
ALTER TOPIC ${path}
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

export const dropTopicTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_topic>}';
    return `DROP TOPIC ${path};`;
};

export const createViewTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`/my_view` : '${1:my_view}';
    return `CREATE VIEW ${path} WITH (security_invoker = TRUE) AS SELECT 1;`;
};

export const dropViewTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_view>}';
    return `DROP VIEW ${path};`;
};
export const dropAsyncReplicationTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_replication>}';
    return `DROP ASYNC REPLICATION ${path};`;
};

export const alterAsyncReplicationTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_replication>}';
    return `ALTER ASYNC REPLICATION ${path} SET (STATE = "DONE", FAILOVER_MODE = "FORCE");`;
};

export const addTableIndex = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    return `ALTER TABLE ${path} ADD INDEX \${2:index_name} GLOBAL ON (\${3:<column_name>});`;
};

export const dropTableIndex = (params?: SchemaQueryParams) => {
    const indexName = params?.relativePath.split('/').pop();
    const path = params?.relativePath.split('/').slice(0, -1).join('/');
    return `ALTER TABLE \`${path || '${1:<my_table>}'}\` DROP INDEX ${indexName || '${2:<index_name>}'};`;
};

export const createCdcStreamTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create_changefeed
ALTER TABLE ${path} ADD CHANGEFEED \${2:changefeed_name} WITH (
    MODE = \${3:mode}, -- KEYS_ONLY, UPDATES, NEW_IMAGE, OLD_IMAGE, or NEW_AND_OLD_IMAGES
    FORMAT = \${4:format}, -- JSON or DEBEZIUM_JSON
    VIRTUAL_TIMESTAMPS = \${5:virtualTimestamps}, -- true or false
    RETENTION_PERIOD = \${6:retentionPeriod}, -- Interval value, e.g., Interval('PT24H')
    TOPIC_MIN_ACTIVE_PARTITIONS = \${7:topicMinActivePartitions},
    INITIAL_SCAN = \${8:initialScan} -- true or false
)

-- MODE options:
--   KEYS_ONLY: Only the primary key components and change flag are written.
--   UPDATES: Updated column values that result from updates are written.
--   NEW_IMAGE: Any column values resulting from updates are written.
--   OLD_IMAGE: Any column values before updates are written.
--   NEW_AND_OLD_IMAGES: A combination of NEW_IMAGE and OLD_IMAGE modes.`;
};

export const createGroupTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create-group
CREATE GROUP \${1:group_name}
-- group_name: The name of the group. It may contain lowercase Latin letters and digits.`;
};

export const createUserTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/create-user
CREATE USER \${1:user_name} [option]
-- user_name: The name of the user. It may contain lowercase Latin letters and digits.
-- option: The password of the user:
    -- PASSWORD 'password' creates a user with the password password. The ENCRYPTED option is always enabled.
    -- PASSWORD NULL creates a user with an empty password.`;
};

export const deleteRowsTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/delete
DELETE FROM ${path}
WHERE Key1 == \${2:key1} AND Key2 >= \${3:key2};`;
};

export const dropGroupTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/drop-group
DROP GROUP [ IF EXISTS ] \${1:<group_name>} [, ...]

-- IF EXISTS: Suppress an error if the group doesn't exist.
-- group_name: The name of the group to be deleted.`;
};

export const dropUserTemplate = () => {
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/drop-user
DROP USER [ IF EXISTS ] \${1:<user_name>} [, ...]

-- IF EXISTS: Suppress an error if the user doesn't exist.
-- user_name: The name of the user to be deleted.`;
};

export const grantPrivilegeTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath
        ? `\`${params?.relativePath}\``
        : '${2:<path_to_scheme_object>}';
    return `
GRANT \${1:<permission_name>} [, ...] | ALL [PRIVILEGES]
ON ${path} [, ...]
TO \${3:<role_name>} [, ...]
[WITH GRANT OPTION]

-- permission_name: The name of the access right to schema objects that needs to be assigned.
-- path_to_scheme_object: The path to the schema object for which rights are being granted.
-- role_name: The name of the user or group to whom rights on the schema object are being granted.
-- WITH GRANT OPTION: Using this construct gives the user or group of users the right to manage access rights - 
--                    to assign or revoke certain rights. This construct has functionality similar to granting 
--                    the "ydb.access.grant" or GRANT right. A subject with the ydb.access.grant right cannot 
--                    grant rights broader than they possess themselves.`;
};

export const revokePrivilegeTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath
        ? `\`${params?.relativePath}\``
        : '${2:<path_to_scheme_object>}';
    return `
REVOKE [GRANT OPTION FOR] \${1:<permission_name>} [, ...] | ALL [PRIVILEGES]
ON ${path} [, ...]
FROM \${3:<role_name>} [, ...]

-- permission_name: The name of the access right to schema objects that needs to be revoked.
-- path_to_scheme_object: The path to the schema object from which rights are being revoked.
-- role_name: The name of the user or group from whom rights on the schema object are being revoked.
-- GRANT OPTION FOR: Using this construct revokes the user's or group's right to manage access rights.
--                   All previously granted rights by this user remain in effect.
--                   This construct has functionality similar to revoking the "ydb.access.grant" or GRANT right.`;
};

export const updateTableTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    return `-- docs: https://ydb.tech/docs/en/yql/reference/syntax/update
UPDATE ${path}
SET Value1 = YQL::ToString(\${2:value2} + 1), Value2 = \${3:value2} - 1
WHERE Key1 > \${4:key1};`;
};

export const dropTableTemplate = (params?: SchemaQueryParams) => {
    const path = params?.relativePath ? `\`${params?.relativePath}\`` : '${1:<my_table>}';
    return `DROP TABLE ${path};`;
};
