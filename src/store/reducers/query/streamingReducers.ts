import type {PayloadAction} from '@reduxjs/toolkit';

import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
} from '../../../types/store/streaming';
import {parseResult} from '../../../utils/query';

import {preparePlanData} from './preparePlanData';
import {prepareQueryData} from './prepareQueryData';
import {INDEX_COLUMN} from './query';
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

export const addStreamingChunks = (state: QueryState, action: PayloadAction<StreamDataChunk[]>) => {
    if (!state.result) {
        return;
    }

    if (!state.result.data) {
        state.result.data = prepareQueryData(null);
    }

    // Initialize speed metrics if not present
    if (!state.result.speedMetrics) {
        state.result.speedMetrics = {
            rowsPerSecond: 0,
            lastUpdateTime: Date.now(),
            recentChunks: [],
        };
    }

    const currentTime = Date.now();
    let totalNewRows = 0;

    const mergedStreamDataChunks = new Map<number, StreamDataChunk>();
    for (const chunk of action.payload) {
        const currentMergedChunk = mergedStreamDataChunks.get(chunk.meta.result_index);
        const chunkRowCount = (chunk.result.rows || []).length;
        totalNewRows += chunkRowCount;

        if (currentMergedChunk) {
            if (!currentMergedChunk.result.rows) {
                currentMergedChunk.result.rows = [];
            }
            for (const row of chunk.result.rows || []) {
                currentMergedChunk.result.rows.push(row);
            }
        } else {
            mergedStreamDataChunks.set(chunk.meta.result_index, chunk);
        }
    }

    // Update speed metrics
    const metrics = state.result.speedMetrics;
    metrics.recentChunks.push({
        timestamp: currentTime,
        rowCount: totalNewRows,
    });

    // Keep only chunks from the last 5 seconds
    const WINDOW_SIZE = 5000; // 5 seconds in milliseconds
    metrics.recentChunks = metrics.recentChunks.filter(
        (chunk) => currentTime - chunk.timestamp <= WINDOW_SIZE,
    );

    // Calculate moving average
    if (metrics.recentChunks.length > 0) {
        const oldestChunkTime = metrics.recentChunks[0].timestamp;
        const timeWindow = (currentTime - oldestChunkTime) / 1000; // Convert to seconds
        const totalRows = metrics.recentChunks.reduce((sum, chunk) => sum + chunk.rowCount, 0);
        metrics.rowsPerSecond = timeWindow > 0 ? totalRows / timeWindow : 0;
    }

    metrics.lastUpdateTime = currentTime;

    if (!state.result.data.resultSets) {
        state.result.data.resultSets = [];
    }

    for (const [resultIndex, chunk] of mergedStreamDataChunks.entries()) {
        const {columns, rows} = chunk.result;

        if (!state.result.data.resultSets[resultIndex]) {
            state.result.data.resultSets[resultIndex] = {
                columns: [],
                result: [],
            };
        }

        if (columns && !state.result.data.resultSets[resultIndex].columns?.length) {
            state.result.data.resultSets[resultIndex].columns?.push(INDEX_COLUMN);
            for (const column of columns) {
                state.result.data.resultSets[resultIndex].columns?.push(column);
            }
        }

        const indexedRows = rows || [];
        const startIndex = state.result?.data?.resultSets?.[resultIndex].result?.length || 1;

        indexedRows.forEach((row, index) => {
            row.unshift(startIndex + index);
        });

        const formattedRows = parseResult(
            indexedRows,
            state.result.data.resultSets[resultIndex].columns || [],
        );

        for (const row of formattedRows) {
            state.result.data.resultSets[resultIndex].result?.push(row);
        }
    }
};
