import {IResponseError} from '../api/error';
import {TEvDescribeSchemeResult} from '../api/schema';

export interface IDescribeState {
    loading: boolean;
    wasLoaded: boolean;
    data: Record<string, TEvDescribeSchemeResult>;
    currentDescribe?: TEvDescribeSchemeResult;
    error?: IResponseError;
}

export interface IDescribeRootStateSlice {
    describe: IDescribeState;
}
