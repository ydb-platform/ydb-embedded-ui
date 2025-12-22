import React from 'react';

import {NumberParam, StringParam, useQueryParams} from 'use-query-params';

import type {TopicDataFilterValue} from './utils/types';
import {TopicDataFilterValueParam} from './utils/types';

export function useTopicDataQueryParams() {
    const [
        {selectedPartition, selectedOffset, startTimestamp, topicDataFilter, activeOffset},
        setQueryParams,
    ] = useQueryParams({
        selectedPartition: StringParam,
        selectedOffset: NumberParam,
        startTimestamp: NumberParam,
        topicDataFilter: TopicDataFilterValueParam,
        activeOffset: StringParam,
    });

    const handleSelectedPartitionChange = React.useCallback(
        (value?: string) => {
            setQueryParams({selectedPartition: value}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleSelectedOffsetChange = React.useCallback(
        (value?: number | null) => {
            setQueryParams({selectedOffset: value || undefined}, 'replaceIn');
        },
        [setQueryParams],
    );

    const handleActiveOffsetChange = React.useCallback(
        (value?: string) => {
            setQueryParams({activeOffset: value}, 'replaceIn');
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
        activeOffset,
        handleSelectedPartitionChange,
        handleSelectedOffsetChange,
        handleStartTimestampChange,
        handleTopicDataFilterChange,
        handleActiveOffsetChange,
    };
}
