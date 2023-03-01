/* eslint-disable camelcase */
import type {Reducer} from 'redux';
import {createSelector, Selector} from 'reselect';

import type {
    IConsumerAction,
    IConsumerRootStateSlice,
    IConsumerState,
    IPreparedPartitionData,
} from '../../types/store/consumer';

import '../../services/api';

import {convertBytesObjectToSpeed} from '../../utils/bytesParsers';
import {parseLag, parseTimestampToIdleTime} from '../../utils/timeParsers';
import {isNumeric} from '../../utils/utils';

import {createRequestActionTypes, createApiRequest} from '../utils';

export const FETCH_CONSUMER = createRequestActionTypes('consumer', 'FETCH_CONSUMER');

const SET_DATA_WAS_NOT_LOADED = 'consumer/SET_DATA_WAS_NOT_LOADED';
const SET_SELECTED_CONSUMER = 'consumer/SET_SELECTED_CONSUMER';

const initialState = {
    loading: false,
    wasLoaded: false,
    data: {},
};

const consumer: Reducer<IConsumerState, IConsumerAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_CONSUMER.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_CONSUMER.SUCCESS: {
            // On older version it can return HTML page of Internal Viewer with an error
            if (typeof action.data !== 'object') {
                return {...state, loading: false, error: {}};
            }

            return {
                ...state,
                data: action.data,
                loading: false,
                wasLoaded: true,
                error: undefined,
            };
        }
        case FETCH_CONSUMER.FAILURE: {
            if (action.error?.isCancelled) {
                return state;
            }

            return {
                ...state,
                error: action.error,
                loading: false,
            };
        }
        case SET_DATA_WAS_NOT_LOADED: {
            return {
                ...state,
                wasLoaded: false,
            };
        }
        case SET_SELECTED_CONSUMER: {
            return {
                ...state,
                selectedConsumer: action.data,
            };
        }
        default:
            return state;
    }
};

export const setDataWasNotLoaded = () => {
    return {
        type: SET_DATA_WAS_NOT_LOADED,
    } as const;
};

export const setSelectedConsumer = (value?: string) => {
    return {
        type: SET_SELECTED_CONSUMER,
        data: value,
    } as const;
};

export function getConsumer(path?: string, consumerName?: string) {
    return createApiRequest({
        request: window.api.getConsumer({path, consumer: consumerName}),
        actions: FETCH_CONSUMER,
    });
}

export const selectPartitions = (state: IConsumerRootStateSlice) => state.consumer.data?.partitions;

export const selectPreparedPartitionsData: Selector<
    IConsumerRootStateSlice,
    IPreparedPartitionData[] | undefined
> = createSelector([selectPartitions], (partitions) => {
    return partitions?.map((partition) => {
        // describe_consumer endpoint doesn't return zero values, so some values will be initialized with 0
        const {partition_id = '0', partition_stats, partition_consumer_stats} = partition;

        const {
            partition_offsets,
            store_size_bytes = '0',
            last_write_time: partition_last_write_time,
            max_write_time_lag: partition_write_lag,
            bytes_written,
            partition_node_id = 0,
        } = partition_stats || {};

        const {start: start_offset = '0', end: end_offset = '0'} = partition_offsets || {};

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
            isNumeric(end_offset) && isNumeric(committed_offset)
                ? Number(end_offset) - Number(committed_offset)
                : 0;

        const unreadMessages =
            isNumeric(end_offset) && isNumeric(last_read_offset)
                ? Number(end_offset) - Number(last_read_offset)
                : 0;

        return {
            partitionId: partition_id,
            storeSize: store_size_bytes,

            writeSpeed: convertBytesObjectToSpeed(bytes_written),
            readSpeed: convertBytesObjectToSpeed(bytes_read),

            partitionWriteLag: parseLag(partition_write_lag),
            partitionWriteIdleTime: parseTimestampToIdleTime(partition_last_write_time),

            consumerWriteLag: parseLag(consumer_write_lag),
            consumerReadLag: parseLag(consumer_read_lag),
            consumerReadIdleTime: parseTimestampToIdleTime(consumer_last_read_time),

            uncommitedMessages,
            unreadMessages,

            startOffset: start_offset,
            endOffset: end_offset,
            commitedOffset: committed_offset,

            readSessionId: read_session_id,
            readerName: reader_name,

            partitionNodeId: partition_node_id,
            connectionNodeId: connection_node_id,
        };
    });
});

export default consumer;
