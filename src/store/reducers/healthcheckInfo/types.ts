import type {HealthCheckAPIResponse, IssueLog} from '../../../types/api/healthcheck';
import type {IResponseError} from '../../../types/api/error';
import type {ApiRequestAction} from '../../utils';
import type {FETCH_HEALTHCHECK, setDataWasNotLoaded} from './healthcheckInfo';

export interface IssuesTree extends IssueLog {
    reasonsItems?: IssuesTree[];
}

export interface HealthcheckInfoState {
    loading: boolean;
    wasLoaded: boolean;
    data?: HealthCheckAPIResponse;
    error?: IResponseError;
}

type HealthCheckApiRequestAction = ApiRequestAction<
    typeof FETCH_HEALTHCHECK,
    HealthCheckAPIResponse,
    IResponseError
>;

export type HealthCheckInfoAction =
    | HealthCheckApiRequestAction
    | ReturnType<typeof setDataWasNotLoaded>;

export interface HealthcheckInfoRootStateSlice {
    healthcheckInfo: HealthcheckInfoState;
}
