export enum ChunkState {
    LOADED = 'loaded',
    LOADING = 'loading',
}

export interface ChunkData<T> {
    data: Array<T | undefined>;
    chunkStates: Map<number, ChunkState>;
    foundCount: number;
    totalCount: number;
}

export enum ChunkActionType {
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

export function chunksReducer<T>(state: ChunkData<T>, action: ChunkAction<T>): ChunkData<T> {
    switch (action.type) {
        case ChunkActionType.LOAD_START:
            return {
                ...state,
                chunkStates: new Map(state.chunkStates).set(action.chunk, ChunkState.LOADING),
            };
        case ChunkActionType.LOAD_SUCCESS: {
            const {data, found, total, offset} = action;
            const newLength = found || state.data.length;

            // Reset rows if length changed
            if (state.data.length !== newLength) {
                return {
                    data: new Array(newLength).fill(undefined),
                    chunkStates: new Map().set(action.chunk, ChunkState.LOADED),
                    foundCount: found,
                    totalCount: total,
                };
            }

            // Update only the fetched range
            const newRows = state.data.slice();
            data.forEach((item, index) => {
                const virtualIndex = offset + index;
                if (virtualIndex < newLength) {
                    newRows[virtualIndex] = item;
                }
            });

            return {
                data: newRows,
                chunkStates: new Map(state.chunkStates).set(action.chunk, ChunkState.LOADED),
                foundCount: found,
                totalCount: total,
            };
        }
        case ChunkActionType.LOAD_ERROR:
            return {
                ...state,
                chunkStates: (() => {
                    const newChunks = new Map(state.chunkStates);
                    newChunks.delete(action.chunk);
                    return newChunks;
                })(),
            };
        case ChunkActionType.RESET:
            return {
                data: [],
                chunkStates: new Map(),
                foundCount: 0,
                totalCount: 0,
            };
        default:
            return state;
    }
}
