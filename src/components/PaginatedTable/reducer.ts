import type {IResponseError} from '../../types/api/error';

import type {Chunk} from './types';

const INIT_CHUNK = 'infiniteTable/INIT_CHUNK';
const REMOVE_CHUNK = 'infiniteTable/REMOVE_CHUNK';
const SET_CHUNK_LOADING = 'infiniteTable/SET_CHUNK_LOADING';
const SET_CHUNK_DATA = 'infiniteTable/SET_CHUNK_DATA';
const SET_CHUNK_ERROR = 'infiniteTable/SET_CHUNK_ERROR';
const RESET_CHUNKS = 'infiniteTable/RESET_CHUNKS';

type PaginatedTableState<T> = Record<string, Chunk<T> | undefined>;

// Intermediary type to pass to ReducerAction (because ReturnType cannot correctly convert generics)
interface SetChunkDataAction<T> {
    type: typeof SET_CHUNK_DATA;
    data: {
        id: string;
        data: T[];
    };
}

export const setChunkData = <T>(id: string, data: T[]): SetChunkDataAction<T> => {
    return {
        type: SET_CHUNK_DATA,
        data: {id, data},
    } as const;
};

export const setChunkError = (id: string, error: IResponseError) => {
    return {
        type: SET_CHUNK_ERROR,
        data: {id, error},
    } as const;
};

export const initChunk = (id: string) => {
    return {
        type: INIT_CHUNK,
        data: {id},
    } as const;
};

export const setChunkLoading = (id: string) => {
    return {
        type: SET_CHUNK_LOADING,
        data: {id},
    } as const;
};

export const removeChunk = (id: string) => {
    return {
        type: REMOVE_CHUNK,
        data: {id},
    } as const;
};

export const resetChunks = () => {
    return {
        type: RESET_CHUNKS,
    } as const;
};

type PaginatedTableAction<T> =
    | SetChunkDataAction<T>
    | ReturnType<typeof setChunkError>
    | ReturnType<typeof initChunk>
    | ReturnType<typeof setChunkLoading>
    | ReturnType<typeof removeChunk>
    | ReturnType<typeof resetChunks>;

// Reducer wrapped in additional function to pass generic type
export const createPaginatedTableReducer =
    <T>(): React.Reducer<PaginatedTableState<T>, PaginatedTableAction<T>> =>
    (state, action) => {
        switch (action.type) {
            case SET_CHUNK_DATA: {
                const {id, data} = action.data;

                return {
                    ...state,
                    [id]: {
                        loading: false,
                        wasLoaded: true,
                        active: true,
                        data,
                    },
                };
            }
            case SET_CHUNK_ERROR: {
                const {id, error} = action.data;

                return {
                    ...state,
                    [id]: {
                        loading: false,
                        wasLoaded: true,
                        active: true,
                        error,
                    },
                };
            }
            case INIT_CHUNK: {
                const {id} = action.data;

                return {
                    ...state,
                    [id]: {
                        loading: false,
                        wasLoaded: false,
                        active: true,
                    },
                };
            }
            case SET_CHUNK_LOADING: {
                const {id} = action.data;

                return {
                    ...state,
                    [id]: {
                        loading: true,
                        wasLoaded: false,
                        active: true,
                    },
                };
            }
            case REMOVE_CHUNK: {
                const {id} = action.data;

                const newState = {...state};
                delete newState[id];

                return newState;
            }
            case RESET_CHUNKS: {
                return {};
            }
            default:
                return state;
        }
    };
