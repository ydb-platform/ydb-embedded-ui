import React from 'react';

import {topQueriesApi} from '../../store/reducers/executeTopQueries/executeTopQueries';
import type {KeyValueRow} from '../../types/api/query';
import {useAutoRefreshInterval} from '../../utils/hooks';
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
    areChartsAvailable: boolean | null; // null = initial load, boolean = result
}

export function useQueriesActivityData(tenantName: string): UseQueriesActivityDataResult {
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const shouldRefresh = autoRefreshInterval;

    const {data: runningQueriesData} = topQueriesApi.useGetRunningQueriesQuery(
        {
            database: tenantName,
            filters: {},
        },
        {pollingInterval: shouldRefresh},
    );

    const {data: queriesPerSecData, isError: queriesError} = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.requests'}],
            timeFrame: QUERIES_TIME_FRAME,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh},
    );

    const {data: latencyData} = chartApi.useGetChartDataQuery(
        {
            database: tenantName,
            metrics: [{target: 'queries.latencies.p99'}],
            timeFrame: LATENCIES_TIME_FRAME,
            maxDataPoints: 30,
        },
        {pollingInterval: shouldRefresh},
    );

    const runningQueriesCount = runningQueriesData?.resultSets?.[0]?.result?.length || 0;

    // Determine chart availability - only show skeleton on initial load
    const areChartsAvailable = React.useMemo(() => {
        if (queriesPerSecData !== undefined) {
            return true; // We have data, charts are available
        }
        if (queriesError) {
            return false; // Error occurred, charts not available
        }
        return null; // Still loading initial data
    }, [queriesPerSecData, queriesError]);

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
