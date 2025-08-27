import React from 'react';

import {Flex} from '@gravity-ui/uikit';

import {defaultDashboardConfig} from '../../containers/Tenant/Diagnostics/TenantOverview/DefaultOverviewContent/defaultDashboardConfig';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {MetricChart} from '../MetricChart/MetricChart';
import type {ChartDataStatus} from '../MetricChart/types';

const b = cn('queries-activity-bar');

interface QueriesActivityChartsProps {
    tenantName: string;
    expanded: boolean;
    onChartDataStatusChange?: (status: ChartDataStatus) => void;
}

const LEGEND_HEIGHT = 34.5;
const QUERIES_PER_SECOND_CHART_HEIGHT = 292;
const QUERIES_LATENCIES_CHART_HEIGHT = 292 + LEGEND_HEIGHT;

export function QueriesActivityCharts({
    tenantName,
    expanded,
    onChartDataStatusChange,
}: QueriesActivityChartsProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const [hasChartsLoaded, setHasChartsLoaded] = React.useState(false);

    // Extract chart configurations from defaultDashboardConfig
    const getChartByTarget = (target: string) => {
        return defaultDashboardConfig.find((chart) =>
            chart.metrics.some((metric) => metric.target === target),
        );
    };

    const queriesChartConfig = getChartByTarget('queries.requests');
    const latenciesChartConfig = getChartByTarget('queries.latencies.p99');

    // Refetch data only if charts have successfully loaded at least once
    const shouldRefresh = hasChartsLoaded ? autoRefreshInterval : 0;

    const handleChartDataStatusChange = React.useCallback(
        (status: ChartDataStatus) => {
            if (status === 'success') {
                setHasChartsLoaded(true);
            }
            // Also call parent callback if provided
            onChartDataStatusChange?.(status);
        },
        [onChartDataStatusChange],
    );

    // Early return if required charts are not found
    if (!queriesChartConfig || !latenciesChartConfig) {
        console.warn('Required chart configurations not found in defaultDashboardConfig');
        return null;
    }

    // WORKAROUND: Charts are rendered outside Disclosure component due to YAGR tooltip bug
    // Issue: https://github.com/gravity-ui/yagr/issues/262

    // Problem: YAGR tooltips don't work when charts are mounted inside collapsible containers
    // that use CSS transforms or have complex nested DOM structures. The tooltip initialization
    // fails when the chart is not immediately visible during mounting.

    // TODO: Remove this workaround once the upstream issue is fixed

    return (
        <Flex
            className={b('charts')}
            gap={4}
            direction="row"
            style={{display: expanded ? undefined : 'none'}}
        >
            <Flex direction="column" gap={3} grow basis={0} minWidth={0}>
                <MetricChart
                    database={tenantName}
                    metrics={queriesChartConfig.metrics}
                    autorefresh={shouldRefresh}
                    height={QUERIES_PER_SECOND_CHART_HEIGHT}
                    chartOptions={queriesChartConfig.options}
                    onChartDataStatusChange={handleChartDataStatusChange}
                    isChartVisible={hasChartsLoaded && expanded}
                    title={queriesChartConfig.title}
                />
            </Flex>

            <Flex direction="column" gap={3} grow basis={0} minWidth={0}>
                <MetricChart
                    database={tenantName}
                    metrics={latenciesChartConfig.metrics}
                    autorefresh={shouldRefresh}
                    height={QUERIES_LATENCIES_CHART_HEIGHT}
                    chartOptions={latenciesChartConfig.options}
                    onChartDataStatusChange={handleChartDataStatusChange}
                    isChartVisible={hasChartsLoaded && expanded}
                    title={latenciesChartConfig.title}
                />
            </Flex>
        </Flex>
    );
}
