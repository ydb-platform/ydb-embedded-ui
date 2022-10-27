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

export interface IHealthcheckInfoRootStateSlice {
    healthcheckInfo: IHealthcheckInfoState;
}
