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
    header?: React.ReactNode;
    className?: string;
    sortable?: boolean;
    resizeable?: boolean;
    render: (props: {row: T; index: number}) => React.ReactNode;
    width: number;
    resizeMaxWidth?: number;
    resizeMinWidth?: number;
    align: AlignType;
}

export interface VirtualTableData<T> {
    data: T[];
    total: number;
    found: number;
}

export type FetchData<T> = (
    limit: number,
    offset: number,
    sortParams?: SortParams,
) => Promise<VirtualTableData<T>>;

export type OnError = (error?: IResponseError) => void;

interface ControlsParams {
    totalEntities: number;
    foundEntities: number;
    inited: boolean;
}

export type RenderControls = (params: ControlsParams) => React.ReactNode;
export type RenderEmptyDataMessage = () => React.ReactNode;
export type RenderErrorMessage = (error: IResponseError) => React.ReactNode;

export type GetRowClassName<T> = (row: T) => string | undefined;
