import {
    healthcheckApi,
    selectClusterLeavesIssues,
    selectLeavesIssues,
} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import type {IssueLog} from '../../../types/api/healthcheck';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import type {ETenantType} from '../../../types/api/tenant';
import {getHealthStatusError} from '../../../utils/healthStatus/healthStatus';
import {useHealthStatusNow} from '../../../utils/healthStatus/useHealthStatusNow';
import {useTypedSelector} from '../../../utils/hooks';

interface HealthcheckParams {
    leavesIssues: IssuesTree[];
    issues: IssueLog[];
    loading: boolean;
    successful: boolean;
    error?: unknown;
    refetch: () => void;
    canRefetch: boolean;
    selfCheckResult: SelfCheckResult;
    fulfilledTimeStamp?: number;
}

export const useHealthcheck = (
    database: string,
    {
        autorefresh,
        clusterName,
        databaseType,
    }: {autorefresh?: number; clusterName?: string; databaseType?: ETenantType} = {},
): HealthcheckParams => {
    const {databaseType: databaseTypeFromLookup} = useTenantBaseInfo(database, clusterName, {
        skip: databaseType !== undefined,
    });
    const resolvedDatabaseType = databaseType ?? databaseTypeFromLookup;
    const {
        currentData: data,
        isFetching,
        isUninitialized,
        error,
        refetch,
        fulfilledTimeStamp,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database, clusterName},
        {
            pollingInterval: autorefresh,
            skip: resolvedDatabaseType === 'Serverless',
        },
    );

    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const leavesIssues = useTypedSelector((state) =>
        selectLeavesIssues(state, database, clusterName),
    );

    return {
        loading: data === undefined && isFetching,
        successful: data !== undefined && error === undefined,
        error,
        refetch,
        canRefetch: !isUninitialized,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
        issues: data?.issue_log ?? [],
    };
};

export const useClusterHealthcheck = (
    clusterName: string,
    {autorefresh, now}: {autorefresh?: number; now?: number} = {},
): HealthcheckParams => {
    const {
        currentData: data,
        isFetching,
        isUninitialized,
        error,
        refetch,
        fulfilledTimeStamp,
    } = healthcheckApi.useGetClusterHealthcheckInfoQuery(
        {clusterName},
        {
            pollingInterval: autorefresh,
        },
    );

    const localNow = useHealthStatusNow(now === undefined);
    const healthError = data ? getHealthStatusError(data, now ?? localNow, error) : undefined;
    const effectiveError = error ?? healthError;
    const selfCheckResult = effectiveError
        ? SelfCheckResult.UNSPECIFIED
        : data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const leavesIssues = useTypedSelector((state) => selectClusterLeavesIssues(state, clusterName));

    return {
        loading: data === undefined && isFetching,
        successful: data !== undefined && effectiveError === undefined,
        error: effectiveError,
        refetch,
        canRefetch: !isUninitialized,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
        issues: data?.issue_log ?? [],
    };
};
