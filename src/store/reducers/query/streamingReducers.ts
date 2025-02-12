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
        state.result.data.stats = chunk.stats;
    }
};

type SpeedMetrics = NonNullable<NonNullable<QueryState['result']>['speedMetrics']>;

const updateSpeedMetrics = (metrics: SpeedMetrics, totalNewRows: number) => {
    const currentTime = Date.now();
    const WINDOW_SIZE = 5000; // 5 seconds in milliseconds

    metrics.recentChunks.push({timestamp: currentTime, rowCount: totalNewRows});
    metrics.recentChunks = metrics.recentChunks.filter(
        (chunk) => currentTime - chunk.timestamp <= WINDOW_SIZE,
    );

    if (metrics.recentChunks.length > 0) {
        const oldestChunkTime = metrics.recentChunks[0].timestamp;
        const timeWindow = (currentTime - oldestChunkTime) / 1000;
        const totalRows = metrics.recentChunks.reduce(
            (sum: number, chunk) => sum + chunk.rowCount,
            0,
        );
        metrics.rowsPerSecond = timeWindow > 0 ? totalRows / timeWindow : 0;
    }

    metrics.lastUpdateTime = currentTime;
};

export const addStreamingChunks = (state: QueryState, action: PayloadAction<StreamDataChunk[]>) => {
    if (!state.result) {
        return;
    }

    state.result.data = state.result.data || prepareQueryData(null);
    state.result.speedMetrics = state.result.speedMetrics || {
        rowsPerSecond: 0,
        lastUpdateTime: Date.now(),
        recentChunks: [],
    };
    state.result.data.resultSets = state.result.data.resultSets || [];

    // Merge chunks by result index
    const mergedChunks = action.payload.reduce((acc: Map<number, StreamDataChunk>, chunk) => {
        const resultIndex = chunk.meta.result_index;
        const currentMergedChunk = acc.get(resultIndex);

        if (currentMergedChunk) {
            currentMergedChunk.result.rows?.push(...(chunk.result.rows || []));
        } else {
            acc.set(resultIndex, {
                ...chunk,
                result: {...chunk.result, rows: chunk.result.rows || []},
            });
        }
        return acc;
    }, new Map<number, StreamDataChunk>());

    const totalNewRows = action.payload.reduce(
        (sum: number, chunk) => sum + (chunk.result.rows?.length || 0),
        0,
    );

    if (state.result.speedMetrics) {
        updateSpeedMetrics(state.result.speedMetrics, totalNewRows);
    }

    // Process merged chunks
    for (const [resultIndex, chunk] of mergedChunks.entries()) {
        const {columns, rows} = chunk.result;
        const resultSet = (state.result.data.resultSets[resultIndex] = state.result.data.resultSets[
            resultIndex
        ] || {
            columns: [],
            result: [],
        });

        if (columns && !resultSet.columns?.length) {
            resultSet.columns = columns;
        }

        const safeRows = rows || [];
        const formattedRows = parseResult(safeRows, resultSet.columns || []);
        resultSet.result?.push(...formattedRows);
    }
};
