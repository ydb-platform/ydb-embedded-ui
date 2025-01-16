import React from 'react';

export enum ChunkState {
    LOADED = 'loaded',
    LOADING = 'loading',
}

interface ChunkData<T> {
    rows: Array<T | undefined>;
    chunks: Map<number, ChunkState>;
    foundCount: number;
    totalCount: number;
}

enum ChunkActionType {
    LOAD_START = 'LOAD_START',
    LOAD_SUCCESS = 'LOAD_SUCCESS',
    LOAD_ERROR = 'LOAD_ERROR',
    RESET = 'RESET',
}

type ChunkAction<T> =
    | {type: ChunkActionType.LOAD_START; chunk: number}
    | {
          type: ChunkActionType.LOAD_SUCCESS;
          chunk: number;
          data: T[];
          found: number;
          total: number;
          offset: number;
          chunkSize: number;
      }
    | {type: ChunkActionType.LOAD_ERROR; chunk: number}
    | {type: ChunkActionType.RESET};

function chunkReducer<T>(state: ChunkData<T>, action: ChunkAction<T>): ChunkData<T> {
    switch (action.type) {
        case ChunkActionType.LOAD_START:
            return {
                ...state,
                chunks: new Map(state.chunks).set(action.chunk, ChunkState.LOADING),
            };
        case ChunkActionType.LOAD_SUCCESS: {
            const {data, found, total, offset} = action;
            const newLength = found || state.rows.length;

            // Reset rows if length changed
            if (state.rows.length !== newLength) {
                return {
                    rows: new Array(newLength).fill(undefined),
                    chunks: new Map().set(action.chunk, ChunkState.LOADED),
                    foundCount: found,
                    totalCount: total,
                };
            }

            // Update only the fetched range
            const newRows = state.rows.slice();
            data.forEach((item, index) => {
                const virtualIndex = offset + index;
                if (virtualIndex < newLength) {
                    newRows[virtualIndex] = item;
                }
            });

            return {
                rows: newRows,
                chunks: new Map(state.chunks).set(action.chunk, ChunkState.LOADED),
                foundCount: found,
                totalCount: total,
            };
        }
        case ChunkActionType.LOAD_ERROR:
            return {
                ...state,
                chunks: (() => {
                    const newChunks = new Map(state.chunks);
                    newChunks.delete(action.chunk);
                    return newChunks;
                })(),
            };
        case ChunkActionType.RESET:
            return {
                rows: [],
                chunks: new Map(),
                foundCount: 0,
                totalCount: 0,
            };
        default:
            return state;
    }
}

export function useChunkLoader<T>(
    chunks: number[],
    chunkSize: number,
    fetchChunk: (offset: number) => Promise<{data: T[]; found: number; total: number}>,
) {
    const [state, dispatch] = React.useReducer(chunkReducer<T>, {
        rows: [],
        chunks: new Map(),
        foundCount: 0,
        totalCount: 0,
    });

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

        chunks.forEach((chunk) => {
            if (!state.chunks.has(chunk)) {
                loadChunk(chunk);
            }
        });
    }, [chunks, chunkSize, fetchChunk, state.chunks]);

    const isLoading = chunks.some((chunk) => state.chunks.get(chunk) === ChunkState.LOADING);

    return {
        rows: state.rows,
        isLoading,
        error,
        foundCount: state.foundCount,
        totalCount: state.totalCount,
    };
}
