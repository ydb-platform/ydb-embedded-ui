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
    currentDescribe?: IDescribeData;
    currentDescribePath?: string;
    error?: IResponseError;
}

export interface IDescribeHandledResponse {
    path: string | undefined;
    data: IDescribeData | undefined;
    currentDescribe: IDescribeData | undefined;
}

type IDescribeApiRequestAction = ApiRequestAction<
    typeof FETCH_DESCRIBE,
    IDescribeHandledResponse,
    IResponseError
>;

export type IDescribeAction =
    | IDescribeApiRequestAction
    | ReturnType<typeof setCurrentDescribePath>
    | ReturnType<typeof setDataWasNotLoaded>;

export interface IDescribeRootStateSlice {
    describe: IDescribeState;
}
