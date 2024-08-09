/* eslint-disable camelcase */
import {createSelector} from '@reduxjs/toolkit';

import {convertBytesObjectToSpeed} from '../../utils/bytesParsers';
import {parseLag, parseTimestampToIdleTime} from '../../utils/timeParsers';
import type {RootState} from '../defaultStore';

import {api} from './api';

export const topicApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTopic: build.query({
            queryFn: async (params: {path: string; database: string}) => {
                try {
                    const data = await window.api.getTopic(params);
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
    (path: string, database: string) => ({path, database}),
    (params) => topicApi.endpoints.getTopic.select(params),
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
