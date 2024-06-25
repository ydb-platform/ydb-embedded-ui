import React from 'react';

import {StringParam, useQueryParam} from 'use-query-params';

import {MetricChart} from '../../../../../components/MetricChart';
import type {
    ChartDataStatus,
    ChartOptions,
    MetricDescription,
} from '../../../../../components/MetricChart';
import {TimeFrameSelector} from '../../../../../components/TimeFrameSelector/TimeFrameSelector';
import {selectAutoRefreshInterval} from '../../../../../store/reducers/autoRefreshControl';
import {cn} from '../../../../../utils/cn';
import {useTypedSelector} from '../../../../../utils/hooks';
import type {TimeFrame} from '../../../../../utils/timeframes';

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
    const [isDashboardHidden, setIsDashboardHidden] = React.useState<boolean>(true);

    const [timeFrame = '1h', setTimeframe] = useQueryParam('timeframe', StringParam);

    const autoRefreshInterval = useTypedSelector(selectAutoRefreshInterval);

    // Refetch data only if dashboard successfully loaded
    const shouldRefresh = isDashboardHidden ? 0 : autoRefreshInterval;

    /**
     * Charts should be hidden, if they are not enabled:
     * 1. GraphShard is not enabled
     * 2. ydb version does not have /viewer/json/render endpoint (400, 404, CORS error, etc.)
     *
     * If at least one chart successfully loaded, dashboard should be shown
     * @link https://github.com/ydb-platform/ydb-embedded-ui/issues/659
     * @todo disable only for specific errors ('GraphShard is not enabled') after ydb-stable-24 is generally used
     */
    const handleChartDataStatusChange = (chartStatus: ChartDataStatus) => {
        if (chartStatus === 'success') {
            setIsDashboardHidden(false);
        }
    };

    // If there is only one chart, display it with full width
    const chartWidth = charts.length === 1 ? CHART_WIDTH_FULL : CHART_WIDTH;
    const chartHeight = CHART_WIDTH / 1.5;

    const renderContent = () => {
        return charts.map((chartConfig) => {
            const chartId = chartConfig.metrics.map(({target}) => target).join('&');
            return (
                <MetricChart
                    key={chartId}
                    database={database}
                    title={chartConfig.title}
                    metrics={chartConfig.metrics}
                    timeFrame={timeFrame as TimeFrame}
                    chartOptions={chartConfig.options}
                    autorefresh={shouldRefresh}
                    width={chartWidth}
                    height={chartHeight}
                    onChartDataStatusChange={handleChartDataStatusChange}
                    isChartVisible={!isDashboardHidden}
                />
            );
        });
    };

    return (
        <div className={b(null)} style={{display: isDashboardHidden ? 'none' : undefined}}>
            <div className={b('controls')}>
                <TimeFrameSelector value={timeFrame as TimeFrame} onChange={setTimeframe} />
            </div>
            <div className={b('charts')}>{renderContent()}</div>
        </div>
    );
};
