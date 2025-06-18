import type {IProtobufTimeObject} from './common';

/**
 * endpoint: /json/describe_consumer
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_topic.proto
 *
 * Original proto file doesn't specify optional fields, so every field is considered optional
 */
export interface DescribeConsumerResult {
    self?: Entry;
    consumer?: Consumer;
    partitions?: PartitionInfo[];
}

/** Partition info types differs for consumer and topic, although they are very similar */
export interface PartitionInfo {
    /** int64  */
    partition_id?: string;

    /** Is partition open for write. */
    active?: boolean;

    /**
     * int64
     *
     * Ids of partitions which was formed when this partition was split or merged.
     */
    child_partition_ids?: string[];

    /**
     * int64
     *
     * Ids of partitions from which this partition was formed by split or merge.
     */
    parent_partition_ids?: string[];

    /** Stats for partition, filled only when include_stats in request is true. */
    partition_stats?: PartitionStats;

    /** Stats for consumer of this partition, filled only when include_stats in request is true. */
    partition_consumer_stats?: PartitionConsumerStats;
}

interface PartitionConsumerStats {
    /**
     * int64
     *
     * Last read offset from this partition.
     */
    last_read_offset?: string;

    /**
     * int64
     *
     * Committed offset for this partition.
     */
    committed_offset?: string;

    /** Reading this partition read session identifier. */
    read_session_id?: string;

    /**
     * google.protobuf.Timestamp
     *
     * Timestamp of providing this partition to this session by server.
     */
    partition_read_session_create_time?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Timestamp
     *
     * Timestamp of last read from this partition.
     */
    last_read_time?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Duration
     *
     * Maximum of differences between timestamp of read and write timestamp for all messages, read during last minute.
     */
    max_read_time_lag?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Duration
     *
     * Maximum of differences between write timestamp and create timestamp for all messages, read during last minute.
     */
    max_write_time_lag?: string | IProtobufTimeObject;

    /** How much bytes were read during several windows statistics from this partiton. */
    bytes_read?: MultipleWindowsStat;

    /** Read session name, provided by client. */
    reader_name?: string;

    /** Host where read session connected. */
    connection_node_id?: number;
}

export interface PartitionStats {
    /** Partition contains messages with offsets in range [start, end). */
    partition_offsets?: OffsetsRange;

    /**
     * int64
     *
     * Approximate size of partition.
     */
    store_size_bytes?: string;

    /**
     * google.protobuf.Timestamp
     *
     * Timestamp of last write.
     */
    last_write_time?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Duration
     *
     * Maximum of differences between write timestamp and create timestamp for all messages, written during last minute.
     */
    max_write_time_lag?: string | IProtobufTimeObject;

    /** How much bytes were written during several windows in this partition. */
    bytes_written?: MultipleWindowsStat;

    /** Host where tablet for this partition works. Useful for debugging purposes. */
    partition_node_id?: number;
}

interface OffsetsRange {
    /** int64  */
    start?: string;
    /** int64  */
    end?: string;
}

export interface Consumer {
    /** Must have valid not empty name as a key. */
    name?: string;

    /** Consumer may be marked as 'important'. It means messages for this consumer will never expire due to retention. */
    important?: boolean;

    /**
     * google.protobuf.Timestamp
     *
     * All messages with smaller server written_at timestamp will be skipped.
     */
    read_from?: string | IProtobufTimeObject;

    /**
     * List of supported codecs by this consumer.
     *
     * supported_codecs on topic must be contained inside this list.
     */
    supported_codecs?: SupportedCodecs;

    /** Attributes of consumer */
    attributes?: Record<string, string>;

    /** Filled only when requested statistics in Describe*Request. */
    consumer_stats?: ConsumerStats;
}

interface ConsumerStats {
    /**
     * google.protobuf.Timestamp
     *
     * Minimal timestamp of last read from partitions.
     */
    min_partitions_last_read_time?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Duration
     *
     * Maximum of differences between timestamp of read and write timestamp for all messages, read during last minute.
     */
    max_read_time_lag?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Duration
     *
     * Maximum of differences between write timestamp and create timestamp for all messages, read during last minute.
     */
    max_write_time_lag?: string | IProtobufTimeObject;

    /** Bytes read stastics. */
    bytes_read?: MultipleWindowsStat;
}

export interface MultipleWindowsStat {
    /** int64  */
    per_minute?: string;
    /** int64  */
    per_hour?: string;
    /** int64  */
    per_day?: string;
}

export interface SupportedCodecs {
    /** List of supported codecs. */
    codecs?: number[];
}

export interface Entry {
    /** For consumer will be topic-name/consumer-name */
    name?: string;

    owner?: string;
    type?: Type;
    effective_permissions?: Permissions[];
    permissions?: Permissions[];

    /**
     * uint64
     *
     * Size of entry in bytes. Currently filled for:
     * - TABLE;
     * - DATABASE.
     *
     * Empty (zero) in other cases.
     */
    size_bytes?: string;

    /** Virtual timestamp when the object was created */
    created_at?: VirtualTimestamp;
}

interface Permissions {
    subject?: string;
    permission_names?: string[];
}

interface VirtualTimestamp {
    /** uint64 */
    plan_step?: string;
    /** uint64 */
    tx_id?: string;
}

enum Type {
    TYPE_UNSPECIFIED = 'TYPE_UNSPECIFIED',
    DIRECTORY = 'DIRECTORY',
    TABLE = 'TABLE',
    PERS_QUEUE_GROUP = 'PERS_QUEUE_GROUP',
    DATABASE = 'DATABASE',
    RTMR_VOLUME = 'RTMR_VOLUME',
    BLOCK_STORE_VOLUME = 'BLOCK_STORE_VOLUME',
    COORDINATION_NODE = 'COORDINATION_NODE',
    COLUMN_STORE = 'COLUMN_STORE ',
    COLUMN_TABLE = 'COLUMN_TABLE ',
    SEQUENCE = 'SEQUENCE ',
    REPLICATION = 'REPLICATION ',
    TOPIC = 'TOPIC ',
}
