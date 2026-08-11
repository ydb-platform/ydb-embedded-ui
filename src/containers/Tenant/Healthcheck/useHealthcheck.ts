import {
    healthcheckApi,
    selectClusterLeavesIssues,
    selectLeavesIssues,
} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
import {SelfCheckResult} from '../../../types/api/healthcheck';
import type {ETenantType} from '../../../types/api/tenant';
import {useTypedSelector} from '../../../utils/hooks';

interface HealthcheckParams {
    leavesIssues: IssuesTree[];
    loading: boolean;
    error?: unknown;
    refetch: () => void;
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
        error,
        refetch,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
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
        error,
        refetch,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
    };
};
