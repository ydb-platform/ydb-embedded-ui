import type {PayloadAction} from '@reduxjs/toolkit';

import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
} from '../../../types/store/streaming';
import {parseResult} from '../../../utils/query';

import {preparePlanData} from './preparePlanData';
import {prepareQueryData} from './prepareQueryData';
import type {QueryState} from './types';

export const setStreamSession = (state: QueryState, action: PayloadAction<SessionChunk>) => {
    if (!state.result) {
        return;
    }

    if (!state.result.data) {
        state.result.data = prepareQueryData(null);
    }

    const chunk = action.payload;
    state.result.isLoading = true;
    state.result.queryId = chunk.meta.query_id;
    state.result.data.traceId = chunk.meta.trace_id;
};

export const setStreamQueryResponse = (
    state: QueryState,
    action: PayloadAction<QueryResponseChunk>,
) => {
    if (!state.result) {
        return;
    }

    if (!state.result.data) {
        state.result.data = prepareQueryData(null);
    }

    state.result.isLoading = false;

    const chunk = action.payload;
    if ('error' in chunk) {
        state.result.error = chunk;
    } else if ('plan' in chunk) {
        if (!state.result.data) {
            state.result.data = prepareQueryData(null);
        }

        const {plan: rawPlan, stats} = chunk;
        const {simplifiedPlan, ...planData} = preparePlanData(rawPlan, stats);
        state.result.data.preparedPlan = Object.keys(planData).length > 0 ? planData : undefined;
        state.result.data.simplifiedPlan = simplifiedPlan;
        state.result.data.plan = chunk.plan;
    }

    if ('stats' in chunk) {
        state.result.data.stats = chunk.stats;
    }

    state.result.endTime = Date.now();
};

const getEmptyResultSet = () => {
    return {
        columns: [],
        result: [],
        truncated: false,
    };
};

export const addStreamingChunks = (state: QueryState, action: PayloadAction<StreamDataChunk[]>) => {
    if (!state.result) {
        return;
    }

    state.result.data = state.result.data || prepareQueryData(null);
    state.result.data.resultSets = state.result.data.resultSets || [];

    // Merge chunks by result index
    const mergedChunks = action.payload.reduce((acc: Map<number, StreamDataChunk>, chunk) => {
        const resultIndex = chunk.meta.result_index;
        const currentMergedChunk = acc.get(resultIndex);

        if (currentMergedChunk) {
            currentMergedChunk.result.rows?.push(...(chunk.result.rows || []));
            currentMergedChunk.result.truncated =
                currentMergedChunk.result.truncated || chunk.result.truncated;
        } else {
            acc.set(resultIndex, {
                ...chunk,
                result: {
                    ...chunk.result,
                    rows: chunk.result.rows || [],
                    truncated: chunk.result.truncated,
                },
            });
        }
        return acc;
    }, new Map<number, StreamDataChunk>());

    // Process merged chunks
    for (const [resultIndex, chunk] of mergedChunks.entries()) {
        const {columns, rows} = chunk.result;
        const resultSets = state.result.data.resultSets;

        if (!resultSets[resultIndex]) {
            resultSets[resultIndex] = getEmptyResultSet();
        }
        const resultSet = resultSets[resultIndex];

        if (columns && !resultSet.columns?.length) {
            resultSet.columns = columns;
        }

        const safeRows = rows || [];
        const formattedRows = parseResult(safeRows, resultSet.columns || []);

        formattedRows.forEach((row) => {
            resultSet.result?.push(row);
        });
        resultSet.truncated = chunk.result.truncated;
    }
};
