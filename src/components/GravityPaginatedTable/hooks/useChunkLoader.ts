import React from 'react';

import {
    ChunkActionType,
    ChunkState,
    chunksReducer,
    createInitialState,
} from '../reducers/chunksReducer';

interface UseChunkLoaderOptions {
    initialEntitiesCount: number;
}

export function useChunkLoader<T>(
    chunkSize: number,
    fetchChunk: (offset: number) => Promise<{data: T[]; found: number; total: number}>,
    options: UseChunkLoaderOptions,
) {
    const {initialEntitiesCount} = options;
    const [state, dispatch] = React.useReducer(
        chunksReducer<T>,
        createInitialState<T>(initialEntitiesCount),
    );

    const [error, setError] = React.useState<Error>();

    const loadChunk = React.useCallback(
        async (chunk: number) => {
            if (state.chunkStates.has(chunk)) {
                return;
            }

            const offset = chunk * chunkSize;
            dispatch({type: ChunkActionType.LOAD_START, chunk});

            try {
                const result = await fetchChunk(offset);
                dispatch({
                    type: ChunkActionType.LOAD_SUCCESS,
                    chunk,
                    data: result.data,
                    found: result.found,
                    total: result.total,
                    offset,
                    chunkSize,
                });
            } catch (e) {
                dispatch({type: ChunkActionType.LOAD_ERROR, chunk});
                setError(e as Error);
            }
        },
        [chunkSize, fetchChunk, state.chunkStates],
    );

    const onRangeChange = React.useCallback(
        (virtualizerInstance: {range?: {startIndex: number; endIndex: number} | null}) => {
            if (!virtualizerInstance.range) {
                return;
            }

            const {startIndex, endIndex} = virtualizerInstance.range;
            const startChunk = Math.floor(startIndex / chunkSize);
            const endChunk = Math.floor(endIndex / chunkSize);

            const visibleChunkIndices = Array.from(
                {length: endChunk - startChunk + 1},
                (_, i) => startChunk + i,
            );

            visibleChunkIndices.forEach(loadChunk);
        },
        [loadChunk, chunkSize],
    );

    const isLoading = Array.from(state.chunkStates.values()).some(
        (chunkState) => chunkState === ChunkState.LOADING,
    );

    const resetTableData = React.useCallback(() => {
        dispatch({type: ChunkActionType.RESET, initialEntitiesCount});
    }, []);

    return {
        data: state.data,
        isLoading,
        error,
        foundCount: state.foundCount,
        totalCount: state.totalCount,
        onRangeChange,
        resetTableData,
    };
}
