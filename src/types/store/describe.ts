import {FETCH_DESCRIBE} from '../../store/reducers/describe';
import {ApiRequestAction} from '../../store/utils';
import {IResponseError} from '../api/error';
import {TEvDescribeSchemeResult} from '../api/schema';

export type IDescribeData = Record<string, TEvDescribeSchemeResult>;

export interface IDescribeState {
    loading: boolean;
    wasLoaded: boolean;
    data: IDescribeData;
    currentDescribe?: TEvDescribeSchemeResult | IDescribeData;
    currentDescribePath?: string;
    error?: IResponseError;
}

export interface IDescribeFetchAdditionalParams {
    resetLoadingState?: boolean;
    currentDescribePath?: string;
}

export type IDescribeAction = ApiRequestAction<
    typeof FETCH_DESCRIBE,
    TEvDescribeSchemeResult | TEvDescribeSchemeResult[],
    IResponseError,
    IDescribeFetchAdditionalParams
>;

export interface IDescribeRootStateSlice {
    describe: IDescribeState;
}
