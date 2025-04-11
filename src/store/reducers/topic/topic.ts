/* eslint-disable camelcase */
import type {PayloadAction} from '@reduxjs/toolkit';
import {createSelector, createSlice} from '@reduxjs/toolkit';

import {convertBytesObjectToSpeed} from '../../../utils/bytesParsers';
import {parseLag, parseTimestampToIdleTime} from '../../../utils/timeParsers';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import type {TopicDataFilterValue} from './types';

const initialState: {
    selectedPartition?: string;
    topicDataFilter: TopicDataFilterValue;
    selectedOffset?: number;
    startTimestamp?: number;
} = {topicDataFilter: 'TIMESTAMP'};

const slice = createSlice({
    name: 'topic',
    initialState,
    reducers: {
        setSelectedPartition: (state, action: PayloadAction<string | undefined>) => {
            state.selectedPartition = action.payload;
        },
        setTopicDataFilter: (state, action: PayloadAction<TopicDataFilterValue>) => {
            state.topicDataFilter = action.payload;
        },
        setSelectedOffset: (state, action: PayloadAction<number | undefined>) => {
            state.selectedOffset = action.payload;
        },
        setStartTimestamp: (state, action: PayloadAction<number | undefined>) => {
            state.startTimestamp = action.payload;
        },
    },
});

export const {setSelectedPartition, setTopicDataFilter, setSelectedOffset, setStartTimestamp} =
    slice.actions;
export default slice.reducer;

export const topicApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTopic: build.query({
            queryFn: async (params: {path: string; database: string}) => {
                try {
                    const data = await window.api.viewer.getTopic(params);
                    // On older version it can return HTML page of Developer UI with an error
                    if (typeof data !== 'object') {
                        return {error: {}};
                    }
                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            providesTags: ['All'],
        }),
    }),
    overrideExisting: 'throw',
});

const createGetTopicSelector = createSelector(
    (path: string) => path,
    (_path: string, database: string) => database,
    (path, database) => topicApi.endpoints.getTopic.select({path, database}),
);

const selectTopicStats = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string) => createGetTopicSelector(path, database),
    (state, selectGetTopic) => selectGetTopic(state).data?.topic_stats,
);
const selectConsumers = createSelector(
    (state: RootState) => state,
    (_state: RootState, path: string, database: string) => createGetTopicSelector(path, database),
    (state, selectGetTopic) => selectGetTopic(state).data?.consumers,
);

export const selectConsumersNames = createSelector(selectConsumers, (consumers) => {
    return consumers
        ?.map((consumer) => consumer?.name)
        .filter((consumer): consumer is string => consumer !== undefined);
});

export const selectPreparedTopicStats = createSelector(selectTopicStats, (rawTopicStats) => {
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

export const selectPreparedConsumersData = createSelector(selectConsumers, (consumers) => {
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
