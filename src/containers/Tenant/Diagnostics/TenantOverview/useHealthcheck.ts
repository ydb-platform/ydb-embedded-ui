import {
    healthcheckApi,
    selectIssuesStatistics,
    selectIssuesTrees,
} from '../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../../types/api/healthcheck';
import type {StatusFlag} from '../../../../types/api/healthcheck';
import {useTypedSelector} from '../../../../utils/hooks';

interface HealthcheckParams {
    issueTrees: IssuesTree[];
    issuesStatistics: [StatusFlag, number][];
    loading: boolean;
    error?: unknown;
    refetch: () => void;
    selfCheckResult: SelfCheckResult;
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
    } = healthcheckApi.useGetHealthcheckInfoQuery(
        {database: tenantName},
        {
            pollingInterval: autorefresh,
        },
    );
    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const issuesStatistics = useTypedSelector((state) => selectIssuesStatistics(state, tenantName));
    const issueTrees = useTypedSelector((state) => selectIssuesTrees(state, tenantName));

    return {
        issueTrees,
        issuesStatistics,
        loading: data === undefined && isFetching,
        error,
        refetch,
        selfCheckResult,
    };
};
