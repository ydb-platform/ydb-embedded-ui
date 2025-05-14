/* eslint-disable camelcase */

import type {IProtobufTimeObject} from './common';
import type {
    Consumer,
    Entry,
    MultipleWindowsStat,
    PartitionStats,
    SupportedCodecs,
} from './consumer';

/**
 * endpoint: /json/describe_topic
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/public/api/protos/ydb_topic.proto
 *
 * Original proto file doesn't specify optional fields, so every field is considered optional
 */
export interface DescribeTopicResult {
    /** Description of scheme object. */
    self?: Entry;

    /** Settings for partitioning */
    partitioning_settings?: PartitioningSettings;

    /** Partitions description. */
    partitions?: PartitionInfo[];

    // Retention settings.
    // Currently, only one limit may be set, so other should not be set.

    /**
     * google.protobuf.Duration
     *
     * How long data in partition should be stored.
     */
    retention_period?: string | IProtobufTimeObject;

    /**
     * int64
     *
     * How much data in partition should be stored.
     * Zero value means infinite limit.
     */
    retention_storage_mb?: string;

    /**
     * List of allowed codecs for writers.
     * Writes with codec not from this list are forbidden.
     */
    supported_codecs?: SupportedCodecs;

    /**
     * int64
     *
     * Partition write speed in bytes per second.
     * Zero value means default limit: 1 MB per second.
     */
    partition_write_speed_bytes_per_second?: string;

    /**
     * int64
     *
     * Burst size for write in partition, in bytes.
     * Zero value means default limit: 1 MB.
     */
    partition_write_burst_bytes?: string;

    /** User and server attributes of topic. Server attributes starts from "_" and will be validated by server. */
    attributes?: Record<string, string>;

    /** List of consumers for this topic. */
    consumers?: Consumer[];

    /** Metering settings. */
    metering_mode?: MeteringMode;

    /** Statistics of topic. */
    topic_stats?: TopicStats;
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
    child_partition_ids?: string;

    /**
     * int64
     *
     * Ids of partitions from which this partition was formed by split or merge.
     */
    parent_partition_ids?: string;

    /** Stats for partition, filled only when include_stats in request is true. */
    partition_stats?: PartitionStats;
}

export interface TopicStats {
    /**
     * int64
     *
     * Approximate size of topic.
     */
    store_size_bytes?: string;

    /**
     * google.protobuf.Timestamp
     *
     * Minimum of timestamps of last write among all partitions.
     */
    min_last_write_time?: string | IProtobufTimeObject;

    /**
     * google.protobuf.Duration
     *
     * Maximum of differences between write timestamp and create timestamp for all messages, written during last minute.
     */
    max_write_time_lag?: string | IProtobufTimeObject;

    /** How much bytes were written statistics. */
    bytes_written?: MultipleWindowsStat;
}

/** Partitioning settings for topic. */
interface PartitioningSettings {
    /**
     * int64
     *
     * Minimum partition count auto merge would stop working at.
     *
     * Zero value means default - 1.
     */
    min_active_partitions?: string;

    /**
     * int64
     *
     * Limit for total partition count, including active (open for write) and read-only partitions.
     *
     * Zero value means default - 100.
     */
    partition_count_limit?: string;
}

enum MeteringMode {
    /** Use default */
    METERING_MODE_UNSPECIFIED = 'METERING_MODE_UNSPECIFIED',

    /** Metering based on resource reservation */
    METERING_MODE_RESERVED_CAPACITY = 'METERING_MODE_RESERVED_CAPACITY',

    /** Metering based on actual consumption. Default. */
    METERING_MODE_REQUEST_UNITS = 'METERING_MODE_REQUEST_UNITS',
}

export interface TopicDataRequest {
    /** path of topic */
    path: string;
    /** database name */
    database?: string;
    /** partition to read from */
    partition: string;
    /** start offset to read from */
    offset?: number;
    /** last offset that can possibly be read */
    last_offset?: number;
    /** min message timestamp to read from */
    read_timestamp?: number;
    /** max number of messages to read (default = 10) */
    limit?: number;
    /** timeout in ms */
    timeout?: number;
    /** max size of single message (default = 1_000_000 (1 MB)) */
    message_size_limit?: number;
}

export interface TopicDataResponse {
    /**
     * uint64
     *
     * Start offset of the returned data range
     */
    StartOffset?: string;

    /**
     * uint64
     *
     * End offset of the returned data range
     */
    EndOffset?: string;

    /**
     * Array of messages
     */
    Messages?: TopicMessage[];

    /**
     * Whether the response was truncated due to size limits
     */
    Truncated?: boolean;
}

export interface TopicMessage {
    /**
     * uint64
     *
     * Message offset in the partition
     */
    Offset?: string | number;

    /**
     * uint64
     *
     * Timestamp when the message was created
     */
    CreateTimestamp?: string;

    /**
     * uint64
     *
     * Timestamp when the message was written
     */
    WriteTimestamp?: string;

    /**
     * uint64
     *
     * Difference between write and create timestamps
     */
    TimestampDiff?: string;

    /**
     * Message content
     */
    Message?: string;

    /**
     * uint32
     *
     * Size of the message in storage
     */
    StorageSize?: number;

    /**
     * uint32
     *
     * Original size of the message before compression
     */
    OriginalSize?: number;

    /**
     * uint32
     *
     * Codec used for message compression
     */
    Codec?: number;

    /**
     * ID of the producer that created the message
     */
    ProducerId?: string;

    /**
     * uint64
     *
     * Sequence number
     */
    SeqNo?: string;

    /**
     * Message metadata
     */
    MessageMetadata?: TopicMessageMetadataItem[];
}

export interface TopicMessageEnhanced extends TopicMessage {
    removed?: boolean;
    notLoaded?: boolean;
}

export interface TopicMessageMetadataItem {
    /**
     * Metadata key
     */
    Key?: string;

    /**
     * Metadata value
     */
    Value?: string;
}
