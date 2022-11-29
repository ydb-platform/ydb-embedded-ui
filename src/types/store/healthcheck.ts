import {ApiRequestAction} from '../../store/utils';
import {FETCH_HEALTHCHECK, setDataWasNotLoaded} from '../../store/reducers/healthcheckInfo';
import {IResponseError} from '../api/error';
import type {HealthCheckAPIResponse, IssueLog} from '../api/healthcheck';

export interface IIssuesTree extends IssueLog {
    reasonsItems?: IIssuesTree[];
}

export type IHealthCheck = HealthCheckAPIResponse;

export interface IHealthcheckInfoState {
    loading: boolean;
    wasLoaded: boolean;
    data?: HealthCheckAPIResponse;
    error?: IResponseError;
}

type IHealthCheckApiRequestAction = ApiRequestAction<
    typeof FETCH_HEALTHCHECK,
    HealthCheckAPIResponse,
    IResponseError
>;

export type IHealthCheckInfoAction =
    | IHealthCheckApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>;

export interface IHealthcheckInfoRootStateSlice {
    healthcheckInfo: IHealthcheckInfoState;
}
