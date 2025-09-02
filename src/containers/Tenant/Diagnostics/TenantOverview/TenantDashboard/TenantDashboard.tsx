import React from 'react';

import {MetricChart} from '../../../../../components/MetricChart';
import type {
    ChartDataStatus,
    ChartOptions,
    MetricDescription,
} from '../../../../../components/MetricChart';
import {useGraphShardExists} from '../../../../../store/reducers/capabilities/hooks';
import {cn} from '../../../../../utils/cn';
import {useAutoRefreshInterval} from '../../../../../utils/hooks';

import './TenantDashboard.scss';

const CHART_WIDTH = 428;
const CHART_WIDTH_FULL = 872;

const b = cn('ydb-tenant-dashboard');

export interface ChartConfig {
    metrics: MetricDescription[];
    title: string;
    options?: ChartOptions;
}

interface TenantDashboardProps {
    database: string;
    charts: ChartConfig[];
}

export const TenantDashboard = ({database, charts}: TenantDashboardProps) => {
    const graphShardExists = useGraphShardExists();

    const [hasSuccessfulChart, setHasSuccessfulChart] = React.useState<boolean>(false);

    const isDashboardHidden = React.useMemo(() => {
        return !graphShardExists && !hasSuccessfulChart;
    }, [graphShardExists, hasSuccessfulChart]);

    const [autoRefreshInterval] = useAutoRefreshInterval();

    // Refetch data only if dashboard successfully loaded
    const shouldRefresh = isDashboardHidden ? 0 : autoRefreshInterval;

    // Do not render charts at all when GraphShard capability explicitly says it's absent
    if (graphShardExists === false) {
        return null;
    }

    /**
     * Charts should be hidden, if they are not enabled:
     * 1. GraphShard is not enabled
     * 2. ydb version does not have /viewer/json/render endpoint (400, 404, CORS error, etc.)
     *
     * If at least one chart successfully loaded, dashboard should be shown
     * This fallback behavior is only used when GraphShardExists capability is not available or false
     * Link: https://github.com/ydb-platform/ydb-embedded-ui/issues/659
     * @todo disable only for specific errors ('GraphShard is not enabled') after ydb-stable-24 is generally used
     */
    const handleChartDataStatusChange = (chartStatus: ChartDataStatus) => {
        // Always track successful chart loads for fallback behavior
        if (chartStatus === 'success') {
            setHasSuccessfulChart(true);
        }
    };

    // If there is only one chart, display it with full width
    const chartWidth = charts.length === 1 ? CHART_WIDTH_FULL : CHART_WIDTH;
    const chartHeight = CHART_WIDTH / 1.5;

    const renderContent = () => {
        return charts.map((chartConfig, index) => (
            <MetricChart
                key={index}
                database={database}
                metrics={chartConfig.metrics}
                chartOptions={chartConfig.options}
                autorefresh={shouldRefresh}
                width={chartWidth}
                height={chartHeight}
                onChartDataStatusChange={handleChartDataStatusChange}
                isChartVisible={!isDashboardHidden}
                title={chartConfig.title}
            />
        ));
    };

    return (
        <div className={b(null)} style={{display: isDashboardHidden ? 'none' : undefined}}>
            <div className={b('charts')}>{renderContent()}</div>
        </div>
    );
};
