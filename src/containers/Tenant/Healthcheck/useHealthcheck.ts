import {
    healthcheckApi,
    selectLeavesIssues,
} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../types/api/healthcheck';
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
    tenantName: string,
    {autorefresh}: {autorefresh?: number} = {},
): HealthcheckParams => {
    const {
        currentData: data,
        isFetching,
        error,
        refetch,
        fulfilledTimeStamp,
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: tenantName},
        {
            pollingInterval: autorefresh,
        },
    );

    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const leavesIssues = useTypedSelector((state) => selectLeavesIssues(state, tenantName));

    return {
        loading: data === undefined && isFetching,
        error,
        refetch,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
    };
};
