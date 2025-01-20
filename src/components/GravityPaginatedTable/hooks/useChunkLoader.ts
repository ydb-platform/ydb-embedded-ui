import React from 'react';

import {
    ChunkActionType,
    ChunkState,
    chunksReducer,
    createInitialState,
} from '../reducers/chunksReducer';

interface UseChunkLoaderOptions {
    initialEntitiesCount?: number;
}

export function useChunkLoader<T>(
    startChunk: number,
    endChunk: number,
    chunkSize: number,
    fetchChunk: (offset: number) => Promise<{data: T[]; found: number; total: number}>,
    options: UseChunkLoaderOptions = {},
) {
    const {initialEntitiesCount} = options;
    const [state, dispatch] = React.useReducer(
        chunksReducer<T>,
        createInitialState<T>(initialEntitiesCount),
    );

    const [error, setError] = React.useState<Error>();
    React.useEffect(() => {
        async function loadChunk(chunk: number) {
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
        }

        const visibleChunkIndices = Array.from(
            {length: endChunk - startChunk + 1},
            (_, i) => startChunk + i,
        );

        visibleChunkIndices.forEach((index) => {
            if (!state.chunkStates.has(index)) {
                loadChunk(index);
            }
        });
    }, [startChunk, endChunk, chunkSize, fetchChunk, state.chunkStates]);

    const isLoading = Array.from(state.chunkStates.values()).some(
        (chunkState) => chunkState === ChunkState.LOADING,
    );

    return {
        data: state.data,
        isLoading,
        error,
        foundCount: state.foundCount,
        totalCount: state.totalCount,
    };
}
