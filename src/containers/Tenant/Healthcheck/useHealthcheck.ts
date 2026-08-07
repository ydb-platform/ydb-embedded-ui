import {
    healthcheckApi,
    selectClusterLeavesIssues,
    selectLeavesIssues,
} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {IssueLog} from '../../../types/api/healthcheck';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import {useTypedSelector} from '../../../utils/hooks';

interface HealthcheckParams {
    leavesIssues: IssuesTree[];
    issues: IssueLog[];
    loading: boolean;
    successful: boolean;
    error?: unknown;
    refetch: () => void;
    selfCheckResult: SelfCheckResult;
    fulfilledTimeStamp?: number;
}

export const useHealthcheck = (
    database: string,
    {autorefresh}: {autorefresh?: number} = {},
): HealthcheckParams => {
    const {databaseType} = useTenantBaseInfo(database);
    const {
        currentData: data,
        isFetching,
        error,
        refetch,
        fulfilledTimeStamp,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database},
        {
            pollingInterval: autorefresh,
            skip: databaseType === 'Serverless',
        },
    );

    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const leavesIssues = useTypedSelector((state) => selectLeavesIssues(state, database));

    return {
        loading: data === undefined && isFetching,
        successful: data !== undefined && error === undefined,
        error,
        refetch,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
        issues: data?.issue_log ?? [],
    };
};

export const useClusterHealthcheck = (
    clusterName: string,
    {autorefresh}: {autorefresh?: number} = {},
): HealthcheckParams => {
    const {
        currentData: data,
        isFetching,
        error,
        refetch,
        fulfilledTimeStamp,
    } = healthcheckApi.useGetClusterHealthcheckInfoQuery(
        {clusterName},
        {
            pollingInterval: autorefresh,
        },
    );

    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const leavesIssues = useTypedSelector((state) => selectClusterLeavesIssues(state, clusterName));

    return {
        loading: data === undefined && isFetching,
        successful: data !== undefined && error === undefined,
        error,
        refetch,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
        issues: data?.issue_log ?? [],
    };
};
