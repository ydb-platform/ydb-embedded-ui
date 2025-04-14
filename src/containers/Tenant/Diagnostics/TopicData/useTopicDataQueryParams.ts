import React from 'react';

import {NumberParam, StringParam, useQueryParams} from 'use-query-params';

import type {TopicDataFilterValue} from './utils/types';
import {TopicDataFilterValueParam} from './utils/types';

export function useTopicDataQueryParams() {
    const [{selectedPartition, selectedOffset, startTimestamp, topicDataFilter}, setQueryParams] =
        useQueryParams({
            selectedPartition: StringParam,
            selectedOffset: NumberParam,
            startTimestamp: NumberParam,
            topicDataFilter: TopicDataFilterValueParam,
        });

    const handleSelectedPartitionChange = React.useCallback(
        (value: string) => {
            setQueryParams({selectedPartition: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleSelectedOffsetChange = React.useCallback(
        (value?: number) => {
            setQueryParams({selectedOffset: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleStartTimestampChange = React.useCallback(
        (value?: number) => {
            setQueryParams({startTimestamp: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleTopicDataFilterChange = React.useCallback(
        (value: TopicDataFilterValue) => {
            setQueryParams({topicDataFilter: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    return {
        selectedPartition,
        selectedOffset,
        startTimestamp,
        topicDataFilter,
        handleSelectedPartitionChange,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleTopicDataFilterChange,
    };
}
