// Long running query for tests
// May cause Memory exceed on real database

export const simpleQuery = 'SELECT 1;';
export const longTableSelect = (limit?: number) =>
    'SELECT * FROM `.sys/pg_class`' + (limit ? ` LIMIT ${limit};` : ';');

// 400 is pretty enough
export const longRunningQuery = new Array(400).fill(simpleQuery).join('');
// 300 × 300 = 90K rows via CROSS JOIN with Sha256 hashing — ~4s locally, enough for streaming + Top queries tests
export const longRunningStreamQuery = `$list1 = ListFromRange(1, 300);
$list2 = ListFromRange(1, 300);
$t1 = SELECT value AS v1 FROM AS_TABLE(AsList(AsStruct($list1 AS value))) FLATTEN BY value;
$t2 = SELECT value AS v2 FROM AS_TABLE(AsList(AsStruct($list2 AS value))) FLATTEN BY value;
SELECT a.v1, b.v2, Digest::Sha256(CAST(a.v1 AS String) || CAST(b.v2 AS String)) AS hash
FROM $t1 AS a CROSS JOIN $t2 AS b;
`;
// 1000 × 1000 = 1M rows via CROSS JOIN with Sha256 hashing — heavy enough to still be running after 1s (for stop-query tests)
export const longerRunningStreamQuery = `$list1 = ListFromRange(1, 1000);
$list2 = ListFromRange(1, 1000);
$t1 = SELECT value AS v1 FROM AS_TABLE(AsList(AsStruct($list1 AS value))) FLATTEN BY value;
$t2 = SELECT value AS v2 FROM AS_TABLE(AsList(AsStruct($list2 AS value))) FLATTEN BY value;
SELECT a.v1, b.v2, Digest::Sha256(CAST(a.v1 AS String) || CAST(b.v2 AS String)) AS hash
FROM $t1 AS a CROSS JOIN $t2 AS b;
`;
// Light query for streaming status transition tests
// Used with small output_chunk_max_size to produce many streaming chunks
export const streamingStatusQuery = `$data = ListFromRange(1, 500000);
SELECT x, Digest::Sha256(CAST(x AS String)) AS hash
FROM AS_TABLE(AsList(AsStruct($data AS x))) FLATTEN BY x;
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
