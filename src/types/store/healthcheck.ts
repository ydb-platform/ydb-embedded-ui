import type {HealthCheckAPIResponse, IssueLog} from '../api/healthcheck';

export interface IIssuesTree extends IssueLog {
    reasonsItems?: IIssuesTree[];
}

export type IHealthCheck = HealthCheckAPIResponse;
