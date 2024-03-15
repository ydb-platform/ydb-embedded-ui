import type {ApiRequestAction} from '../../utils';
import type {IResponseError} from '../../../types/api/error';
import type {TEvDescribeSchemeResult} from '../../../types/api/schema';

import {FETCH_OVERVIEW, setDataWasNotLoaded, setCurrentOverviewPath} from './overview';
import {Nullable} from '../../../utils/typecheckers';

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
