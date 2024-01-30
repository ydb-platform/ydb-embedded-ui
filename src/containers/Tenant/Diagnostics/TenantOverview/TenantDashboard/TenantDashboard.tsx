import {useRef, useState} from 'react';
import {StringParam, useQueryParam} from 'use-query-params';

import {cn} from '../../../../../utils/cn';
import type {TimeFrame} from '../../../../../utils/timeframes';
import {useTypedSelector} from '../../../../../utils/hooks';
import {TimeFrameSelector} from '../../../../../components/TimeFrameSelector/TimeFrameSelector';
import {
    type ChartOptions,
    MetricChart,
    type MetricDescription,
    type ChartDataStatus,
} from '../../../../../components/MetricChart';

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
    charts: ChartConfig[];
    onDashboardLoad?: VoidFunction;
}

type TenantDashboardStatus = 'success' | 'error' | undefined;

type DashboardsChartsStatuses = Record<string, ChartDataStatus>;

export const TenantDashboard = ({charts, onDashboardLoad}: TenantDashboardProps) => {
    const [dashboardStatus, setDashboardStatus] = useState<TenantDashboardStatus>();
    const chartsStatuses = useRef<DashboardsChartsStatuses>({});

    const [timeFrame = '1h', setTimeframe] = useQueryParam('timeframe', StringParam);

    const {autorefresh} = useTypedSelector((state) => state.schema);

    /**
     * Charts should be hidden, if they are not enabled:
     * 1. GraphShard is not enabled
     * 2. ydb version does not have /viewer/json/render endpoint (400, 404, CORS error, etc.)
     * @link https://github.com/ydb-platform/ydb-embedded-ui/issues/659
     * @todo disable only for specific errors ('GraphShard is not enabled') after ydb-stable-24 is generally used
     */
    const handleChartDataStatusChange = (chartId: string, chartStatus: ChartDataStatus) => {
        // If status for chart or dashboard is set, doesn't update it
        // Dashboard should be consistently hidden or shown
        if (dashboardStatus || chartsStatuses.current[chartId] || chartStatus === 'loading') {
            return;
        }
        chartsStatuses.current[chartId] = chartStatus;

        // Show dashboard, if at least one chart is successfully loaded
        if (chartStatus === 'success') {
            setDashboardStatus('success');
            onDashboardLoad?.();
            return;
        }

        // If there is no charts with successfull data load, dashboard shouldn't be shown
        if (Object.keys(chartsStatuses.current).length === charts.length) {
            setDashboardStatus('error');
            onDashboardLoad?.();
        }
    };

    // Do not continue render charts if dashboard not valid
    if (dashboardStatus === 'error') {
        return null;
    }

    // If there is only one chart, display it with full width
    const chartWidth = charts.length === 1 ? CHART_WIDTH_FULL : CHART_WIDTH;
    const chartHeight = CHART_WIDTH / 1.5;

    const renderContent = () => {
        return charts.map((chartConfig) => {
            const chartId = chartConfig.metrics.map(({target}) => target).join('&');
            return (
                <MetricChart
                    key={chartId}
                    title={chartConfig.title}
                    metrics={chartConfig.metrics}
                    timeFrame={timeFrame as TimeFrame}
                    chartOptions={chartConfig.options}
                    autorefresh={autorefresh}
                    width={chartWidth}
                    height={chartHeight}
                    onChartDataStatusChange={(status) =>
                        handleChartDataStatusChange(chartId, status)
                    }
                />
            );
        });
    };

    return (
        <div className={b(null)}>
            <div className={b('controls')}>
                <TimeFrameSelector value={timeFrame as TimeFrame} onChange={setTimeframe} />
            </div>
            <div className={b('charts')}>{renderContent()}</div>
        </div>
    );
};
