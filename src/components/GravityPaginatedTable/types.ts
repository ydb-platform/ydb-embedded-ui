import type {IResponseError} from '../../types/api/error';

import type {ASCENDING, CENTER, DESCENDING, LEFT, RIGHT} from './constants';

export type AlignType = typeof LEFT | typeof RIGHT | typeof CENTER;
export type SortOrderType = typeof ASCENDING | typeof DESCENDING;

export interface Column<T> {
    name: string;
    header?: React.ReactNode;
    className?: string;
    sortable?: boolean;
    resizeable?: boolean;
    render: (props: {row: T; index: number}) => React.ReactNode;
    width?: number;
    resizeMaxWidth?: number;
    resizeMinWidth?: number;
    align: AlignType;
}

export interface PaginatedTableData<T> {
    data: T[];
    total: number;
    found: number;
}

export type SortParams = {
    columnId?: string;
    sortOrder?: SortOrderType;
};

type FetchDataParams<F, E = {}> = {
    limit: number;
    offset: number;
    filters?: F;
    sortParams?: SortParams;
    columnsIds: string[];
    signal?: AbortSignal;
} & E;

export type FetchData<T, F = undefined, E = {}> = (
    params: FetchDataParams<F, E>,
) => Promise<PaginatedTableData<T>>;

export type RowIdentifier = string | number;
export type GetRowId<T> = (row: T) => RowIdentifier;

export type VirtualRowType = 'data' | 'loading' | 'empty';

export interface VirtualRow<T> {
    id: string | number;
    type: VirtualRowType;
    data?: T;
    index: number;
}

export interface UseTableDataProps<T, F> {
    getRowId: GetRowId<T>;
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName: string;
    columns: Column<T>[];
    chunkSize?: number;
    initialEntitiesCount?: number;
    autoRefreshInterval?: number;
}

export interface UseTableDataResult<T> {
    data: T[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasNextPage: boolean;
    error?: IResponseError;
    totalEntities: number;
    foundEntities: number;
    loadMoreData: () => Promise<void>;
}

export interface ControlsParams {
    totalEntities: number;
    foundEntities: number;
    inited: boolean;
}

export type RenderControls = (params: ControlsParams) => React.ReactNode;

export interface GravityPaginatedTableProps<T, F = undefined> {
    /**
     * Function to extract unique identifier from a row
     */
    getRowId: GetRowId<T>;
    columnsWidthLSKey: string;
    columns: Column<T>[];
    fetchData: FetchData<T, F>;
    filters?: F;
    tableName?: string;
    getRowClassName?: (row: T) => string | undefined;
    rowHeight?: number;
    parentRef: React.RefObject<HTMLDivElement>;
    renderControls?: (props: {
        inited: boolean;
        totalEntities: number;
        foundEntities: number;
    }) => React.ReactNode;
    renderErrorMessage?: (error: IResponseError) => React.ReactNode;
    renderEmptyDataMessage?: () => React.ReactNode;
    initialEntitiesCount?: number;
    /**
     * Maximum number of rows to show in the initial viewport
     * @default 10
     */
    maxVisibleRows?: number;
    /**
     * Minimum height of the table container in pixels
     * If not provided, will be calculated as rowHeight * 3
     */
    minHeight?: number;
}
