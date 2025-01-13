import type {IResponseError} from '../../types/api/error';
import type {Column, FetchData} from '../PaginatedTable/types';

export interface BaseEntity {
    id?: string | number;
    NodeId?: string | number;
}

export type VirtualRowType = 'data' | 'loading' | 'empty';

export interface VirtualRow<T> {
    id: string | number;
    type: VirtualRowType;
    data?: T;
    index: number;
}

export interface UseTableDataProps<T extends BaseEntity, F> {
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

export interface TableContainerProps {
    height?: string | number;
    className?: string;
    children: React.ReactNode;
    initialHeight?: number;
}

export interface ControlsParams {
    totalEntities: number;
    foundEntities: number;
    inited: boolean;
}

export type RenderControls = (params: ControlsParams) => React.ReactNode;

export interface GravityPaginatedTableProps<T extends BaseEntity, F> {
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

export interface TableContainerState {
    isInitialRender: boolean;
    containerHeight: number;
}
