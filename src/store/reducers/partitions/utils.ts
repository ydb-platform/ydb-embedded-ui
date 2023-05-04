/* eslint-disable camelcase */
import type {
    PartitionInfo as ConsumerPartitionInfo,
    PartitionStats,
} from '../../../types/api/consumer';
import type {PartitionInfo as TopicPartitionInfo} from '../../../types/api/topic';

import {convertBytesObjectToSpeed} from '../../../utils/bytesParsers';
import {parseLag, parseTimestampToIdleTime} from '../../../utils/timeParsers';
import {isNumeric} from '../../../utils/utils';
import {PreparedPartitionData} from './types';

const prepareGeneralPartitionStats = (partitionStats: PartitionStats | undefined) => {
    const {
        partition_offsets,
        store_size_bytes = '0',
        last_write_time: partition_last_write_time,
        max_write_time_lag: partition_write_lag,
        bytes_written,
        partition_node_id = 0,
    } = partitionStats || {};

    const {start: start_offset = '0', end: end_offset = '0'} = partition_offsets || {};

    return {
        storeSize: store_size_bytes,
        writeSpeed: convertBytesObjectToSpeed(bytes_written),
        partitionWriteLag: parseLag(partition_write_lag),
        partitionWriteIdleTime: parseTimestampToIdleTime(partition_last_write_time),
        startOffset: start_offset,
        endOffset: end_offset,
        partitionNodeId: partition_node_id,
    };
};

export const prepareTopicPartitions = (
    partitions?: TopicPartitionInfo[],
): PreparedPartitionData[] | undefined => {
    return partitions?.map((partition) => {
        // describe_topic endpoint doesn't return zero values, so some values will be initialized with 0
        const {partition_id = '0', partition_stats} = partition;

        const preparedPartitionStats = prepareGeneralPartitionStats(partition_stats);

        return {
            partitionId: partition_id,
            ...preparedPartitionStats,
        };
    });
};

export const prepareConsumerPartitions = (
    partitions?: ConsumerPartitionInfo[],
): PreparedPartitionData[] | undefined => {
    return partitions?.map((partition) => {
        // describe_consumer endpoint doesn't return zero values, so some values will be initialized with 0
        const {partition_id = '0', partition_stats, partition_consumer_stats} = partition;

        const preparedPartitionStats = prepareGeneralPartitionStats(partition_stats);
        const endOffset = preparedPartitionStats;

        const {
            last_read_offset = '0',
            committed_offset = '0',
            read_session_id,
            last_read_time: consumer_last_read_time,
            max_read_time_lag: consumer_read_lag,
            max_write_time_lag: consumer_write_lag,
            bytes_read,
            reader_name,
            connection_node_id = 0,
        } = partition_consumer_stats || {};

        const uncommitedMessages =
            isNumeric(endOffset) && isNumeric(committed_offset)
                ? Number(endOffset) - Number(committed_offset)
                : 0;

        const unreadMessages =
            isNumeric(endOffset) && isNumeric(last_read_offset)
                ? Number(endOffset) - Number(last_read_offset)
                : 0;

        return {
            ...preparedPartitionStats,
            partitionId: partition_id,
            readSpeed: convertBytesObjectToSpeed(bytes_read),
            consumerWriteLag: parseLag(consumer_write_lag),
            consumerReadLag: parseLag(consumer_read_lag),
            consumerReadIdleTime: parseTimestampToIdleTime(consumer_last_read_time),
            uncommitedMessages,
            unreadMessages,
            commitedOffset: committed_offset,
            readSessionId: read_session_id,
            readerName: reader_name,
            connectionNodeId: connection_node_id,
        };
    });
};
