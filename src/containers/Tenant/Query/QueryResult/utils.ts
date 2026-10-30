import type {QueryResult} from '../../../../store/reducers/query/types';
import {safeParseNumber} from '../../../../utils/utils';

export function getResultRowsPerSecond(result: QueryResult): number | undefined {
    const {data, error, isLoading, streamingStatus} = result;
    if (
        error ||
        isLoading ||
        streamingStatus ||
        !result.endTime ||
        data?.resultSets?.length !== 1 ||
        data.stats?.Executions?.length !== 1
    ) {
        return undefined;
    }
    const resultSet = data.resultSets[0];
    const {ResultRows, DurationUs} = data.stats.Executions[0];
    if (!resultSet?.result || resultSet.truncated) {
        return undefined;
    }
    const rows = safeParseNumber(ResultRows, NaN);
    const duration = safeParseNumber(DurationUs, NaN);
    if (
        !Number.isSafeInteger(rows) ||
        rows < 0 ||
        rows !== resultSet.result.length ||
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return undefined;
    }
    const rate = (rows * 1_000_000) / duration;
    return Number.isFinite(rate) ? rate : undefined;
}

function isCompletedRun(result: QueryResult): boolean {
    return Boolean(
        !result.error &&
            !result.isLoading &&
            !result.streamingStatus &&
            result.endTime &&
            result.type === 'execute',
    );
}

export function isQueryPlanNotEnabled(result: QueryResult): boolean {
    const {data, statisticsMode} = result;
    return (
        isCompletedRun(result) &&
        (statisticsMode === 'none' || statisticsMode === 'basic') &&
        !data?.plan &&
        !data?.preparedPlan?.pristine &&
        !data?.preparedPlan?.nodes?.length &&
        !data?.simplifiedPlan?.plan?.length
    );
}

export function isStatisticsNotEnabled(result: QueryResult): boolean {
    return isCompletedRun(result) && result.statisticsMode === 'none' && !result.data?.stats;
}
