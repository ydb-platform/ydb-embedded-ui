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

export function createInitialState<T>(initialEntitiesCount?: number): ChunkData<T> {
    const count = initialEntitiesCount ?? 0;
    return {
        data: count > 0 ? new Array(count).fill(undefined) : [],
        chunkStates: new Map(),
        foundCount: count,
        totalCount: count,
    };
}

export function chunksReducer<T>(state: ChunkData<T>, action: ChunkAction<T>): ChunkData<T> {
    console.group('ChunksReducer');
    console.log('Action:', action);
    console.log('Previous state:', {
        ...state,
        chunkStates: Object.fromEntries(state.chunkStates),
    });

    let result: ChunkData<T> = state;
    switch (action.type) {
        case ChunkActionType.LOAD_START:
            result = {
                ...state,
                chunkStates: new Map(state.chunkStates).set(action.chunk, ChunkState.LOADING),
            };
            break;
        case ChunkActionType.LOAD_SUCCESS: {
            const {data, found, total, offset} = action;
            const newLength = found || state.data.length;

            // Create base array - either new or copy of existing
            const baseArray =
                state.data.length === newLength
                    ? state.data.slice()
                    : new Array(newLength).fill(undefined);

            // Populate with new chunk data
            data.forEach((item, index) => {
                const virtualIndex = offset + index;
                if (virtualIndex < newLength) {
                    baseArray[virtualIndex] = item;
                }
            });

            result = {
                data: baseArray,
                chunkStates: new Map(
                    state.data.length === newLength ? state.chunkStates : undefined,
                ).set(action.chunk, ChunkState.LOADED),
                foundCount: found,
                totalCount: total,
            };
            break;
        }
        case ChunkActionType.LOAD_ERROR:
            result = {
                ...state,
                chunkStates: (() => {
                    const newChunks = new Map(state.chunkStates);
                    newChunks.delete(action.chunk);
                    return newChunks;
                })(),
            };
            break;
        case ChunkActionType.RESET:
            result = createInitialState();
            break;
        default:
            break;
    }

    console.log('Next state:', {
        ...result,
        chunkStates: Object.fromEntries(result.chunkStates),
    });
    console.groupEnd();
    return result;
}
