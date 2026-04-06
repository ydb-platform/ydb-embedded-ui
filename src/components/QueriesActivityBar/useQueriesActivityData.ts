import React from 'react';

import {selectGraphShardExists} from '../../store/reducers/capabilities/capabilities';
import {topQueriesApi} from '../../store/reducers/executeTopQueries/executeTopQueries';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useTypedSelector} from '../../utils/hooks/useTypedSelector';
import type {TimeFrame} from '../../utils/timeframes';
import {chartApi} from '../MetricChart/reducer';

import {calculateLatency, calculateQueriesPerSecond} from './utils';

// Configuration constants for chart timeframes
const QUERIES_TIME_FRAME: TimeFrame = '1h';
const LATENCIES_TIME_FRAME: TimeFrame = '1h';

interface UseQueriesActivityDataResult {
    runningQueriesCount: number;
    uniqueApplications: number;
    uniqueUsers: number;
    qps: ReturnType<typeof calculateQueriesPerSecond>;
    latency: ReturnType<typeof calculateLatency>;
    areChartsAvailable: boolean | null; // null = loading, boolean = result
}

export function useQueriesActivityData(database: string): UseQueriesActivityDataResult {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const shouldRefresh = autoRefreshInterval;

    // Respect GraphShardExists if explicitly false for the specific tenant
    const graphShardExists = useTypedSelector((state) => selectGraphShardExists(state, database));
    const skipCharts = graphShardExists === false;

    const {data: runningQueriesCountData} = topQueriesApi.useGetRunningQueriesCountQuery(
        {
            database,
        },
        {pollingInterval: shouldRefresh},
    );

    const {
        data: queriesPerSecData,
        isSuccess: queriesSuccess,
        isError: queriesError,
    } = chartApi.useGetChartDataQuery(
        {
            database,
            metrics: [{target: 'queries.requests'}],
            timeFrame: QUERIES_TIME_FRAME,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh, skip: skipCharts},
    );

    const {data: latencyData} = chartApi.useGetChartDataQuery(
        {
            database,
            metrics: [{target: 'queries.latencies.p99'}],
            timeFrame: LATENCIES_TIME_FRAME,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh, skip: skipCharts},
    );

    const runningQueriesCount = runningQueriesCountData?.runningQueriesCount ?? 0;
    const uniqueApplications = runningQueriesCountData?.uniqueApplications ?? 0;
    const uniqueUsers = runningQueriesCountData?.uniqueUsers ?? 0;

    // Determine chart availability from queries API success/error state
    const areChartsAvailable = React.useMemo(() => {
        if (skipCharts) {
            return false;
        }
        if (queriesSuccess) {
            return true;
        }
        if (queriesError) {
            return false;
        }
        return null; // Still loading
    }, [queriesSuccess, queriesError, skipCharts]);

    const qps = React.useMemo(
        () => calculateQueriesPerSecond(queriesPerSecData?.metrics?.[0]?.data),
        [queriesPerSecData?.metrics?.[0]?.data],
    );

    const latency = React.useMemo(
        () => calculateLatency(latencyData?.metrics?.[0]?.data),
        [latencyData?.metrics?.[0]?.data],
    );

    return {
        runningQueriesCount,
        uniqueApplications,
        uniqueUsers,
        qps,
        latency,
        areChartsAvailable,
    };
}
