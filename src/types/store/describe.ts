import {
    FETCH_DESCRIBE,
    setCurrentDescribePath,
    setDataWasNotLoaded,
} from '../../store/reducers/describe';
import {ApiRequestAction} from '../../store/utils';
import {IResponseError} from '../api/error';
import {TEvDescribeSchemeResult} from '../api/schema';

export type IDescribeData = Record<string, TEvDescribeSchemeResult>;

export interface IDescribeState {
    loading: boolean;
    wasLoaded: boolean;
    data: IDescribeData;
    currentDescribe?: TEvDescribeSchemeResult;
    currentDescribePath?: string;
    error?: IResponseError;
}

type IDescribeApiRequestAction = ApiRequestAction<
    typeof FETCH_DESCRIBE,
    TEvDescribeSchemeResult,
    IResponseError
>;

export type IDescribeAction =
    | IDescribeApiRequestAction
    | ReturnType<typeof setCurrentDescribePath>
    | ReturnType<typeof setDataWasNotLoaded>;

export interface IDescribeRootStateSlice {
    describe: IDescribeState;
}
