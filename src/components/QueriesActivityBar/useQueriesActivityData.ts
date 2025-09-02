import React from 'react';

import {selectGraphShardExists} from '../../store/reducers/capabilities/capabilities';
import {topQueriesApi} from '../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../types/api/query';
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

export function useQueriesActivityData(tenantName: string): UseQueriesActivityDataResult {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const shouldRefresh = autoRefreshInterval;

    // Respect GraphShardExists if explicitly false for the specific tenant
    const graphShardExists = useTypedSelector((state) => selectGraphShardExists(state, tenantName));
    const skipCharts = graphShardExists === false;

    const {data: runningQueriesData} = topQueriesApi.useGetRunningQueriesQuery(
        {
            database: tenantName,
            filters: {},
        },
        {pollingInterval: shouldRefresh},
    );

    const {
        data: queriesPerSecData,
        isSuccess: queriesSuccess,
        isError: queriesError,
    } = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.requests'}],
            timeFrame: QUERIES_TIME_FRAME,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh, skip: skipCharts},
    );

    const {data: latencyData} = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.latencies.p99'}],
            timeFrame: LATENCIES_TIME_FRAME,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh, skip: skipCharts},
    );

    const runningQueriesCount = runningQueriesData?.resultSets?.[0]?.result?.length || 0;

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

    const uniqueApplications = React.useMemo(() => {
        const apps = new Set<string>();
        runningQueriesData?.resultSets?.[0]?.result?.forEach((row: KeyValueRow) => {
            if (row.ApplicationName) {
                apps.add(String(row.ApplicationName));
            }
        });
        return apps.size;
    }, [runningQueriesData]);

    const uniqueUsers = React.useMemo(() => {
        const users = new Set<string>();
        runningQueriesData?.resultSets?.[0]?.result?.forEach((row: KeyValueRow) => {
            if (row.UserSID) {
                users.add(String(row.UserSID));
            }
        });
        return users.size;
    }, [runningQueriesData]);

    return {
        runningQueriesCount,
        uniqueApplications,
        uniqueUsers,
        qps,
        latency,
        areChartsAvailable,
    };
}
