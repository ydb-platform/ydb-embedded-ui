import {useCallback} from 'react';

import {
    getHealthcheckInfo,
    selectIssuesStatistics,
    selectIssuesTrees,
    setDataWasNotLoaded,
} from '../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import type {IssuesTree} from '../../../../store/reducers/healthcheckInfo/types';
import {type StatusFlag, SelfCheckResult} from '../../../../types/api/healthcheck';
import type {IResponseError} from '../../../../types/api/error';
import {useTypedSelector, useTypedDispatch} from '../../../../utils/hooks';

interface HealthcheckParams {
    issueTrees: IssuesTree[];
    issuesStatistics: [StatusFlag, number][];
    fetchHealthcheck: (isBackground?: boolean) => void;
    loading: boolean;
    wasLoaded: boolean;
    error?: IResponseError;
    selfCheckResult: SelfCheckResult;
}

export const useHealthcheck = (tenantName: string): HealthcheckParams => {
    const dispatch = useTypedDispatch();

    const {data, loading, wasLoaded, error} = useTypedSelector((state) => state.healthcheckInfo);
    const selfCheckResult = data?.self_check_result || SelfCheckResult.UNSPECIFIED;
    const issuesStatistics = useTypedSelector(selectIssuesStatistics);
    const issueTrees = useTypedSelector(selectIssuesTrees);

    const fetchHealthcheck = useCallback(
        (isBackground = true) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            dispatch(getHealthcheckInfo(tenantName));
        },
        [dispatch, tenantName],
    );

    return {
        issueTrees,
        issuesStatistics,
        fetchHealthcheck,
        loading,
        wasLoaded,
        error,
        selfCheckResult,
    };
};
