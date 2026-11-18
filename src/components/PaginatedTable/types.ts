import type {IResponseError} from '../../types/api/error';

import type {ASCENDING, CENTER, DESCENDING, LEFT, RIGHT} from './constants';

export interface Chunk<T> {
    active: boolean;
    loading: boolean;
    wasLoaded: boolean;
    data?: T[];
    error?: IResponseError;
}

export type GetChunk<T> = (id: number) => Chunk<T> | undefined;

export type OnEntry = (id: string) => void;
export type OnLeave = (id: string) => void;

export type AlignType = typeof LEFT | typeof RIGHT | typeof CENTER;
export type SortOrderType = typeof ASCENDING | typeof DESCENDING;

export type SortParams = {columnId?: string; sortOrder?: SortOrderType};
export type OnSort = (params: SortParams) => void;

export type HandleTableColumnsResize = (columnId: string, width: number) => void;

export interface Column<T> {
    name: string;
    note?: string;
    header?: React.ReactNode;
    className?: string;
    sortable?: boolean;
    resizeable?: boolean;
    render: (props: {row: T}) => React.ReactNode;
    width?: number;
    resizeMaxWidth?: number;
    resizeMinWidth?: number;
    align: AlignType;
}

export interface PaginatedTableData<T, M = unknown> {
    data: T[];
    total: number;
    found: number;
    /**
     * What the fetcher tells about the response besides the rows. The table does not look into it
     * and hands it to `onChunkDataChange` as is: the type parameter ties the fetcher to the callback.
     */
    meta?: M;
}

type FetchDataParams<F, E = {}> = {
    limit: number;
    offset: number;
    filters?: F;
    sortParams?: SortParams;
    columnsIds: string[];
    signal?: AbortSignal;
} & E;

export type FetchData<T, F = undefined, E = {}, M = unknown> = (
    params: FetchDataParams<F, E>,
) => Promise<PaginatedTableData<T, M>>;

/**
 * Tells what rows of a chunk are in the table now: its data while the chunk renders its rows
 * and is loaded for the current filters and sorting, `undefined` otherwise. Chunks are kept
 * loaded further from the viewport than they are rendered, and such a chunk reports `undefined`.
 */
export type OnChunkDataChange<T, M = unknown> = (
    chunkOffset: number,
    data: PaginatedTableData<T, M> | undefined,
) => void;

export type OnError = (error?: IResponseError) => void;

export interface PaginatedTableState {
    sortParams?: SortParams;
    totalEntities: number;
    foundEntities: number;
    isInitialLoad: boolean;
}

export type RenderControls = () => React.ReactNode;
export type RenderEmptyDataMessage = () => React.ReactNode;
export type RenderErrorMessage = (error: IResponseError) => React.ReactNode;

export type GetRowClassName<T> = (row: T) => string;
export type OnRowClick<T> = (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void;
