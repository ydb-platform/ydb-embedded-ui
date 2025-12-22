import {
    healthcheckApi,
    selectLeavesIssues,
} from '../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../store/reducers/healthcheckInfo/types';
import {useTenantBaseInfo} from '../../../store/reducers/tenant/tenant';
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
        error,
        refetch,
        selfCheckResult,
        fulfilledTimeStamp,
        leavesIssues,
    };
};
