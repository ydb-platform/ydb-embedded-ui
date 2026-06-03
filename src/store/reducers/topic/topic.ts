/* eslint-disable camelcase */
import {createSelector} from '@reduxjs/toolkit';

import type {IProtobufTimeObject} from '../../../types/api/common';
import type {DescribeTopicResult, TopicDataRequest} from '../../../types/api/topic';
import {convertBytesObjectToSpeed} from '../../../utils/bytesParsers';
import {isQueryErrorResponse, parseQueryAPIResponse} from '../../../utils/query';
import {parseLag, parseTimestampToIdleTime} from '../../../utils/timeParsers';
import type {RootState} from '../../defaultStore';
import {api} from '../api';

import type {TopicFormValues} from './utils';
import {AutoPartitioningStrategy, buildAlterTopicQuery, buildCreateTopicQuery} from './utils';

export const TOPIC_MESSAGE_SIZE_LIMIT = 100;

interface TopicDataQueryRequest extends TopicDataRequest {
    clusterName?: string;
    useMeta?: boolean;
}

const DEFAULT_RETENTION_PERIOD_SECONDS = 4 * 60 * 60;
const DEFAULT_WRITE_QUOTA_BYTES = 1024 * 1024;

export const topicApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTopic: build.query({
            queryFn: async ({
                path,
                database,
                databaseFullPath,
                useMetaProxy,
            }: {
                path: string;
                database: string;
                databaseFullPath: string;
                useMetaProxy?: boolean;
            }) => {
                try {
                    const data = await window.api.viewer.getTopic({
                        path: {path, databaseFullPath, useMetaProxy},
                        database,
                    });
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
        getTopicData: build.query({
            queryFn: async ({clusterName, useMeta, ...params}: TopicDataQueryRequest) => {
                try {
                    const requestParams = {
                        message_size_limit: TOPIC_MESSAGE_SIZE_LIMIT,
                        ...params,
                    };

                    const data =
                        useMeta && window.api.meta
                            ? await window.api.meta.getSchemaTopicData({
                                  ...requestParams,
                                  clusterName,
                              })
                            : await window.api.viewer.getTopicData(requestParams);

                    return {data};
                } catch (error) {
                    return {error};
                }
            },
            keepUnusedDataFor: 0,
        }),
        createTopic: build.mutation({
            queryFn: async ({
                database,
                formData,
            }: {
                database: string;
                formData: TopicFormValues;
            }) => {
                try {
                    const query = buildCreateTopicQuery(formData);

                    const response = await window.api.viewer.sendQuery({
                        query,
                        database,
                        action: 'execute-query',
                    });

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: parseQueryAPIResponse(response)};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['All']),
        }),
        updateTopic: build.mutation({
            queryFn: async ({
                database,
                formData,
            }: {
                database: string;
                formData: TopicFormValues;
            }) => {
                try {
                    const query = buildAlterTopicQuery(formData);

                    const response = await window.api.viewer.sendQuery({
                        query,
                        database,
                        action: 'execute-query',
                    });

                    if (isQueryErrorResponse(response)) {
                        return {error: response};
                    }

                    return {data: parseQueryAPIResponse(response)};
                } catch (error) {
                    return {error};
                }
            },
            invalidatesTags: (_result, error) => (error ? [] : ['All']),
        }),
    }),
    overrideExisting: 'throw',
});

const createGetTopicSelector = createSelector(
    (path: string) => path,
    (_path: string, database: string) => database,
    (_path: string, _database: string, databaseFullPath: string) => databaseFullPath,
    (_path: string, _database: string, _databaseFullPath: string, useMetaProxy?: boolean) =>
        useMetaProxy,
    (path, database, databaseFullPath, useMetaProxy) =>
        topicApi.endpoints.getTopic.select({path, database, databaseFullPath, useMetaProxy}),
);

const selectTopicStats = createSelector(
    (state: RootState) => state,
    (
        _state: RootState,
        path: string,
        database: string,
        databaseFullPath: string,
        useMetaProxy?: boolean,
    ) => createGetTopicSelector(path, database, databaseFullPath, useMetaProxy),
    (state, selectGetTopic) => selectGetTopic(state).data?.topic_stats,
);

const selectConsumers = createSelector(
    (state: RootState) => state,
    (
        _state: RootState,
        path: string,
        database: string,
        databaseFullPath: string,
        useMetaProxy?: boolean,
    ) => createGetTopicSelector(path, database, databaseFullPath, useMetaProxy),
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

function parseDurationToSeconds(duration?: string | IProtobufTimeObject): number | undefined {
    if (!duration) {
        return undefined;
    }

    if (typeof duration === 'string') {
        const match = duration.match(/^(\d+)s$/);
        return match ? parseInt(match[1], 10) : undefined;
    }

    if (typeof duration === 'object' && duration.seconds !== undefined) {
        return typeof duration.seconds === 'string'
            ? parseInt(duration.seconds, 10)
            : duration.seconds;
    }

    return undefined;
}

function getTopicRetentionFormValues(topicData: DescribeTopicResult) {
    const parsedRetentionStorageMb = parseInt(topicData.retention_storage_mb ?? '0', 10);
    const retentionPeriodSeconds = parseDurationToSeconds(topicData.retention_period);
    const retentionStorageMb = Number.isFinite(parsedRetentionStorageMb)
        ? parsedRetentionStorageMb
        : 0;
    const hasStorageRetention = retentionStorageMb > 0;

    return {
        retentionPeriodSeconds: retentionPeriodSeconds ?? DEFAULT_RETENTION_PERIOD_SECONDS,
        storageLimitMb: retentionStorageMb,
        retentionType: hasStorageRetention ? 'size' : 'time',
    } as const;
}

export const selectTopicFormValues = createSelector(
    (state: RootState) => state,
    (
        _state: RootState,
        path: string,
        database: string,
        databaseFullPath: string,
        useMetaProxy?: boolean,
    ) => createGetTopicSelector(path, database, databaseFullPath, useMetaProxy),
    (state, selectGetTopic) => {
        const topicData = selectGetTopic(state).data;
        if (!topicData) {
            return undefined;
        }

        const minActivePartitions = parseInt(
            topicData.partitioning_settings?.min_active_partitions ?? '1',
            10,
        );
        const maxActivePartitions = parseInt(
            topicData.partitioning_settings?.max_active_partitions ??
                topicData.partitioning_settings?.partition_count_limit ??
                '0',
            10,
        );
        const parsedPartitionCountLimit = parseInt(
            topicData.partitioning_settings?.partition_count_limit ?? '',
            10,
        );
        const parsedWriteQuotaBytes = parseInt(
            topicData.partition_write_speed_bytes_per_second ?? '',
            10,
        );

        const writeQuotaBytes = Number.isFinite(parsedWriteQuotaBytes)
            ? parsedWriteQuotaBytes
            : DEFAULT_WRITE_QUOTA_BYTES;
        const partitionCountLimit = Number.isFinite(parsedPartitionCountLimit)
            ? parsedPartitionCountLimit
            : undefined;
        const retentionValues = getTopicRetentionFormValues(topicData);
        const autoPartitioningSettings =
            topicData.partitioning_settings?.auto_partitioning_settings;
        const autoPartitioningStrategy = String(
            autoPartitioningSettings?.strategy ?? AutoPartitioningStrategy.Unspecified,
        );
        const autoPartitioningEnabled =
            autoPartitioningStrategy !== AutoPartitioningStrategy.Disabled &&
            autoPartitioningStrategy !== AutoPartitioningStrategy.Unspecified;
        const partitionWriteSpeed = autoPartitioningSettings?.partition_write_speed;

        return {
            name: topicData.self?.name,
            shards: minActivePartitions,
            partitionCountLimit,
            writeQuotaBytes,
            ...retentionValues,
            autoPartitioning: {
                enabled: autoPartitioningEnabled,
                mode: autoPartitioningStrategy,
                minPartitions: minActivePartitions,
                maxPartitions: maxActivePartitions > 0 ? maxActivePartitions : undefined,
                stabilizationWindow: parseDurationToSeconds(
                    partitionWriteSpeed?.stabilization_window,
                ),
                upUtilization: partitionWriteSpeed?.up_utilization_percent,
            },
        } as TopicFormValues;
    },
);
