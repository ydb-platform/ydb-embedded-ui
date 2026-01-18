import type {PayloadAction} from '@reduxjs/toolkit';

import type {
    QueryResponseChunk,
    SessionChunk,
    StreamDataChunk,
} from '../../../../types/store/streaming';
import {parseResult} from '../../../../utils/query';
import {preparePlanData} from '../parsers/preparePlanData';
import {prepareQueryData} from '../parsers/prepareQueryData';
import type {QueryState} from '../types';

export const setStreamSession = (
    state: QueryState,
    action: PayloadAction<{tabId: string; chunk: SessionChunk}>,
) => {
    const {tabId, chunk} = action.payload;
    const tab = state.tabsById[tabId];
    if (!tab?.result) {
        return;
    }

    const data = tab.result.data ?? (tab.result.data = prepareQueryData(null));

    tab.result.isLoading = true;
    tab.result.queryId = chunk.meta.query_id;
    data.traceId = chunk.meta.trace_id;
};

export const setStreamQueryResponse = (
    state: QueryState,
    action: PayloadAction<{tabId: string; chunk: QueryResponseChunk}>,
) => {
    const {tabId, chunk} = action.payload;
    const tab = state.tabsById[tabId];
    if (!tab?.result) {
        return;
    }

    const data = tab.result.data ?? (tab.result.data = prepareQueryData(null));

    tab.result.isLoading = false;

    if ('error' in chunk) {
        tab.result.error = chunk;
    } else if ('plan' in chunk) {
        const {plan: rawPlan, stats} = chunk;
        const {simplifiedPlan, ...planData} = preparePlanData(rawPlan, stats);
        data.preparedPlan = Object.keys(planData).length > 0 ? planData : undefined;
        data.simplifiedPlan = simplifiedPlan;
        data.plan = chunk.plan;
    }

    if ('stats' in chunk) {
        data.stats = chunk.stats;
    }

    tab.result.endTime = Date.now();
};

const getEmptyResultSet = () => {
    return {
        columns: [],
        result: [],
        truncated: false,
    };
};

export const addStreamingChunks = (
    state: QueryState,
    action: PayloadAction<{tabId: string; chunks: StreamDataChunk[]}>,
) => {
    const {tabId, chunks} = action.payload;
    const tab = state.tabsById[tabId];
    if (!tab?.result) {
        return;
    }

    const data = tab.result.data ?? (tab.result.data = prepareQueryData(null));
    data.resultSets = data.resultSets || [];

    // Merge chunks by result index
    const mergedChunks = chunks.reduce((acc: Map<number, StreamDataChunk>, chunk) => {
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
        const resultSets = data.resultSets;

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
