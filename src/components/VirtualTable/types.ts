import type {ReactNode} from 'react';

import type {IResponseError} from '../../types/api/error';

import {ASCENDING, CENTER, DESCENDING, LEFT, RIGHT} from './constants';

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

export interface Column<T> {
    name: string;
    header?: ReactNode;
    className?: string;
    sortable?: boolean;
    render: (props: {row: T; index: number}) => ReactNode;
    width: number;
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

export type RenderControls = (params: ControlsParams) => ReactNode;
export type RenderEmptyDataMessage = () => ReactNode;
export type RenderErrorMessage = (error: IResponseError) => ReactNode;

export type GetRowClassName<T> = (row: T) => string | undefined;
