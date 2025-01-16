export enum ChunkState {
    LOADED = 'loaded',
    LOADING = 'loading',
}

export interface TableState<T> {
    rows: Array<T | undefined>;
    foundEntities: number;
    totalEntities: number;
    chunkStates: Array<ChunkState | undefined>;
}

export enum TableActionType {
    UPDATE_DATA = 'UPDATE_DATA',
    UPDATE_CHUNK_STATE = 'UPDATE_CHUNK_STATE',
    RESET_ROWS = 'RESET_ROWS',
}

export type TableAction<T> =
    | {
          type: TableActionType.UPDATE_DATA;
          payload: {data: T[]; found: number; total: number; offset: number; chunkSize: number};
      }
    | {
          type: TableActionType.UPDATE_CHUNK_STATE;
          payload: {chunkIndex: number; state: ChunkState | undefined};
      }
    | {type: TableActionType.RESET_ROWS; payload: {length: number; chunkSize: number}};

export function tableReducer<T>(state: TableState<T>, action: TableAction<T>): TableState<T> {
    switch (action.type) {
        case TableActionType.UPDATE_DATA: {
            const {data, found, total, offset, chunkSize} = action.payload;
            const newLength = found || state.rows.length;
            const chunkIndex = Math.floor(offset / chunkSize);

            // Reset rows if length changed
            if (state.rows.length !== newLength) {
                const totalChunks = Math.ceil(newLength / chunkSize);
                return {
                    rows: new Array(newLength).fill(undefined),
                    chunkStates: new Array(totalChunks).fill(undefined),
                    foundEntities: found,
                    totalEntities: total,
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

            const newChunkStates = [...state.chunkStates];
            newChunkStates[chunkIndex] = ChunkState.LOADED;

            return {
                rows: newRows,
                chunkStates: newChunkStates,
                foundEntities: found,
                totalEntities: total,
            };
        }
        case TableActionType.UPDATE_CHUNK_STATE: {
            const {chunkIndex, state: chunkState} = action.payload;
            const newChunkStates = [...state.chunkStates];
            newChunkStates[chunkIndex] = chunkState;
            return {
                ...state,
                chunkStates: newChunkStates,
            };
        }
        case TableActionType.RESET_ROWS: {
            const totalChunks = Math.ceil(action.payload.length / action.payload.chunkSize);
            return {
                ...state,
                rows: new Array(action.payload.length).fill(undefined),
                chunkStates: new Array(totalChunks).fill(undefined),
            };
        }
        default:
            return state;
    }
}
