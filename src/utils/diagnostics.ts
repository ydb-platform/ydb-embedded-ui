export const TOP_QUERIES_COLUMNS_IDS = {
    CPUTimeUs: 'CPUTime',
    QueryText: 'QueryText',
    EndTime: 'EndTime',
    ReadRows: 'ReadRows',
    ReadBytes: 'ReadBytes',
    UserSID: 'UserSID',
    OneLineQueryText: 'OneLineQueryText',
    QueryHash: 'QueryHash',
    Duration: 'Duration',
};

export const TOP_SHARD_COLUMNS_IDS = {
    TabletId: 'TabletId',
    CPUCores: 'CPUCores',
    DataSize: 'DataSize',
    Path: 'Path',
    NodeId: 'NodeId',
    PeakTime: 'PeakTime',
    InFlightTxCount: 'InFlightTxCount',
    IntervalEnd: 'IntervalEnd',
};

const TOP_SHARDS_SORT_VALUES = [
    TOP_SHARD_COLUMNS_IDS.CPUCores,
    TOP_SHARD_COLUMNS_IDS.DataSize,
    TOP_SHARD_COLUMNS_IDS.InFlightTxCount,
];

const TOP_QUERIES_SORT_VALUES = [
    TOP_QUERIES_COLUMNS_IDS.CPUTimeUs,
    TOP_QUERIES_COLUMNS_IDS.EndTime,
    TOP_QUERIES_COLUMNS_IDS.ReadRows,
    TOP_QUERIES_COLUMNS_IDS.ReadBytes,
    TOP_QUERIES_COLUMNS_IDS.UserSID,
    TOP_QUERIES_COLUMNS_IDS.Duration,
];

export const isSortableTopShardsProperty = (value: string) =>
    Object.values(TOP_SHARDS_SORT_VALUES).includes(value);

export const isSortableTopQueriesProperty = (value: string) =>
    Object.values(TOP_QUERIES_SORT_VALUES).includes(value);
