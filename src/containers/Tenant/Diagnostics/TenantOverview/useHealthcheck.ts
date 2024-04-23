import {
    healthcheckApi,
    selectIssuesStatistics,
    selectIssuesTrees,
} from '../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {SelfCheckResult} from '../../../../types/api/healthcheck';
import type {StatusFlag} from '../../../../types/api/healthcheck';
import {DEFAULT_POLLING_INTERVAL} from '../../../../utils/constants';
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
    {autorefresh}: {autorefresh?: boolean} = {},
): HealthcheckParams => {
    const {
        currentData: data,
        isFetching,
        error,
        refetch,
    } = healthcheckApi.useGetHealthcheckInfoQuery(tenantName, {
        pollingInterval: autorefresh ? DEFAULT_POLLING_INTERVAL : 0,
    });
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
