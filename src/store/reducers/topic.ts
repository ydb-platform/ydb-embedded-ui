/* eslint-disable camelcase */
import type {Reducer} from 'redux';
import {createSelector, Selector} from 'reselect';

import type {
    IPreparedConsumerData,
    IPreparedTopicStats,
    ITopicAction,
    ITopicRootStateSlice,
    ITopicState,
} from '../../types/store/topic';

import {createRequestActionTypes, createApiRequest} from '../utils';
import {parseLag, parseTimestampToIdleTime} from '../../utils/timeParsers';
import {convertBytesObjectToSpeed} from '../../utils/bytesParsers';

export const FETCH_TOPIC = createRequestActionTypes('topic', 'FETCH_TOPIC');

const SET_DATA_WAS_NOT_LOADED = 'topic/SET_DATA_WAS_NOT_LOADED';
const CLEAN_TOPIC_DATA = 'topic/CLEAN_TOPIC_DATA';

const initialState = {
    loading: true,
    wasLoaded: false,
    data: undefined,
};

const topic: Reducer<ITopicState, ITopicAction> = (state = initialState, action) => {
    switch (action.type) {
        case FETCH_TOPIC.REQUEST: {
            return {
                ...state,
                loading: true,
            };
        }
        case FETCH_TOPIC.SUCCESS: {
            // On older version it can return HTML page of Developer UI with an error
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
        case FETCH_TOPIC.FAILURE: {
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
        case CLEAN_TOPIC_DATA: {
            return {
                ...state,
                data: undefined,
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

export const cleanTopicData = () => {
    return {
        type: CLEAN_TOPIC_DATA,
    } as const;
};

export function getTopic(path?: string) {
    return createApiRequest({
        request: window.api.getTopic({path}),
        actions: FETCH_TOPIC,
    });
}

const selectTopicStats = (state: ITopicRootStateSlice) => state.topic.data?.topic_stats;
const selectConsumers = (state: ITopicRootStateSlice) => state.topic.data?.consumers;

export const selectConsumersNames: Selector<ITopicRootStateSlice, string[] | undefined> =
    createSelector([selectConsumers], (consumers) => {
        return consumers
            ?.map((consumer) => consumer?.name)
            .filter((consumer): consumer is string => consumer !== undefined);
    });

export const selectPreparedTopicStats: Selector<
    ITopicRootStateSlice,
    IPreparedTopicStats | undefined
> = createSelector([selectTopicStats], (rawTopicStats) => {
    if (!rawTopicStats) {
        return undefined;
    }

    const {
        store_size_bytes = '0',
        min_last_write_time,
        max_write_time_lag,
        bytes_written,
    } = rawTopicStats || {};

    return {
        storeSize: store_size_bytes,
        partitionsIdleTime: parseTimestampToIdleTime(min_last_write_time),
        partitionsWriteLag: parseLag(max_write_time_lag),
        writeSpeed: convertBytesObjectToSpeed(bytes_written),
    };
});

export const selectPreparedConsumersData: Selector<
    ITopicRootStateSlice,
    IPreparedConsumerData[] | undefined
> = createSelector([selectConsumers], (consumers) => {
    return consumers?.map((consumer) => {
        const {name, consumer_stats} = consumer || {};

        const {min_partitions_last_read_time, max_read_time_lag, max_write_time_lag, bytes_read} =
            consumer_stats || {};

        return {
            name,
            readSpeed: convertBytesObjectToSpeed(bytes_read),

            writeLag: parseLag(max_write_time_lag),
            readLag: parseLag(max_read_time_lag),
            readIdleTime: parseTimestampToIdleTime(min_partitions_last_read_time),
        };
    });
});

export default topic;
