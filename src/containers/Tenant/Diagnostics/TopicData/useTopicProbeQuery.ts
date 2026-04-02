import React from 'react';

import {skipToken} from '@reduxjs/toolkit/query';
import {isNil} from 'lodash';

import {topicApi} from '../../../../store/reducers/topic';
import type {TopicDataRequest, TopicDataResponse} from '../../../../types/api/topic';
import {safeParseNumber} from '../../../../utils/utils';

interface UseTopicProbeQueryParams {
    path: string;
    database: string;
    selectedPartition: string | null | undefined;
    selectedOffset: number | null | undefined;
    startTimestamp: number | null | undefined;
    setBoundOffsets: (props: {startOffset: number; endOffset: number}) => void;
}

interface UseTopicProbeQueryResult {
    error: unknown;
    isFetching: boolean;
    emptyData: boolean;
    currentData: TopicDataResponse | undefined;
}

export function useTopicProbeQuery({
    path,
    database,
    selectedPartition,
    selectedOffset,
    startTimestamp,
    setBoundOffsets,
}: UseTopicProbeQueryParams): UseTopicProbeQueryResult {
    const [emptyData, setEmptyData] = React.useState(false);

    const queryParams = React.useMemo(() => {
        if (isNil(selectedPartition)) {
            return skipToken;
        }
        const params: TopicDataRequest = {database, path, partition: selectedPartition, limit: 1};
        if (startTimestamp) {
            params.read_timestamp = startTimestamp;
        } else if (isNil(selectedOffset)) {
            return skipToken;
        } else {
            params.offset = Number(selectedOffset);
        }
        return params;
    }, [selectedPartition, selectedOffset, startTimestamp, database, path]);

    const isProbeSkipped = queryParams === skipToken;

    const {currentData, error, isFetching} = topicApi.useGetTopicDataQuery(queryParams);

    // Reset emptyData when the probe query is skipped (e.g. filters cleared via "show all")
    // to prevent stale isEmpty flag from blocking the table fetch
    React.useEffect(() => {
        if (isProbeSkipped) {
            setEmptyData(false);
        }
    }, [isProbeSkipped]);

    React.useEffect(() => {
        // values should be recalculated only when data is fetched
        if (isFetching || (!currentData && !error)) {
            return;
        }
        // When there's an error (e.g. 403), don't mark as empty —
        // let the table fetch data itself so it can display the error properly
        if (error) {
            setEmptyData(false);
            return;
        }
        const hasMessages = Boolean(currentData?.Messages?.length);
        setEmptyData(!hasMessages);
        if (currentData) {
            setBoundOffsets({
                startOffset: safeParseNumber(currentData.StartOffset),
                endOffset: safeParseNumber(currentData.EndOffset),
            });
        }
    }, [isFetching, currentData, error, setBoundOffsets]);

    return {error, isFetching, emptyData, currentData};
}
