import type {IssueLog, SelfCheckResult} from '../../../types/api/healthcheck';

export type HealthcheckAssistantTarget =
    | {scope: 'database'; request: {database: string}}
    | {scope: 'cluster'; request: {clusterName: string} | {database: string}};

export type HealthcheckAssistantSnapshot = {
    selfCheckResult: SelfCheckResult;
    issues: IssueLog[];
    fulfilledAt?: number;
};

export type HealthcheckAssistantActionProps =
    | {
          action: 'diagnostics';
          target: HealthcheckAssistantTarget;
          snapshot: HealthcheckAssistantSnapshot;
      }
    | {
          action: 'fix';
          target: HealthcheckAssistantTarget;
          snapshot: HealthcheckAssistantSnapshot;
          issue: IssueLog;
      };
