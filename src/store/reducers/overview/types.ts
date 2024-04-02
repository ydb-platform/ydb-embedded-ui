import type {IResponseError} from '../../../types/api/error';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';
import type {Nullable} from '../../../utils/typecheckers';
import type {ApiRequestAction} from '../../utils';

import type {FETCH_OVERVIEW, setCurrentOverviewPath, setDataWasNotLoaded} from './overview';

export interface OverviewState {
    loading: boolean;
    wasLoaded: boolean;
    currentOverviewPath?: string;
    data?: Nullable<TEvDescribeSchemeResult>;
    additionalData?: Nullable<TEvDescribeSchemeResult>[];
    error?: IResponseError;
}

export interface OverviewHandledResponse {
    data: Nullable<TEvDescribeSchemeResult>;
    additionalData?: Nullable<TEvDescribeSchemeResult>[];
}

export type OverviewAction =
    | ApiRequestAction<typeof FETCH_OVERVIEW, OverviewHandledResponse, IResponseError>
    | ReturnType<typeof setCurrentOverviewPath>
    | ReturnType<typeof setDataWasNotLoaded>;
