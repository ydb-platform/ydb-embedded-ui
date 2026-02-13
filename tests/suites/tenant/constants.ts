// Long running query for tests
// May cause Memory exceed on real database

export const simpleQuery = 'SELECT 1;';
export const longTableSelect = (limit?: number) =>
    'SELECT * FROM `.sys/pg_class`' + (limit ? ` LIMIT ${limit};` : ';');

export const longRunningExplainQuery = new Array(400).fill(simpleQuery).join('');
export const longRunningStreamQuery = `$sample = AsList(AsStruct(ListFromRange(1, 100000) AS value1, ListFromRange(1, 1000) AS value2, CAST(1 AS Uint32) AS id));

SELECT value1, value2, id FROM as_table($sample) FLATTEN BY (value1);
`;
export const longerRunningStreamQuery = `$sample = AsList(AsStruct(ListFromRange(1, 1000000) AS value1, ListFromRange(1, 10000) AS value2, CAST(1 AS Uint32) AS id));

SELECT value1, value2, id FROM as_table($sample) FLATTEN BY (value1);
`;
export const selectFromMyRowTableQuery = 'select * from `my_row_table`';

export const createTableQuery = `
CREATE TABLE \`/local/ydb_row_table\` (
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
