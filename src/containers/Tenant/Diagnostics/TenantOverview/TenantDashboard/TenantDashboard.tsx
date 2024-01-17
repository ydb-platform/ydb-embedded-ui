import {cn} from '../../../../../utils/cn';
import type {TimeFrame} from '../../../../../utils/timeframes';
import {useQueryParam} from '../../../../../utils/hooks/useQueryParam';
import {useSetting, useTypedSelector} from '../../../../../utils/hooks';
import {DISPLAY_CHARTS_IN_DB_DIAGNOSTICS_KEY} from '../../../../../utils/constants';
import {TimeFrameSelector} from '../../../../../components/TimeFrameSelector/TimeFrameSelector';
import {
    type ChartOptions,
    MetricChart,
    type MetricDescription,
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
}

export const TenantDashboard = ({charts}: TenantDashboardProps) => {
    const [timeFrame, setTimeframe] = useQueryParam('timeframe', '1h');

    const {autorefresh} = useTypedSelector((state) => state.schema);

    const [chartsEnabled] = useSetting(DISPLAY_CHARTS_IN_DB_DIAGNOSTICS_KEY);

    if (!chartsEnabled) {
        return null;
    }

    // If there is only one chart, display it with full width
    const chartWidth = charts.length === 1 ? CHART_WIDTH_FULL : CHART_WIDTH;
    const chartHeight = CHART_WIDTH / 1.5;

    const renderContent = () => {
        return charts.map((chartConfig) => {
            return (
                <MetricChart
                    key={chartConfig.metrics.map(({target}) => target).join('&')}
                    title={chartConfig.title}
                    metrics={chartConfig.metrics}
                    timeFrame={timeFrame as TimeFrame}
                    chartOptions={chartConfig.options}
                    autorefresh={autorefresh}
                    width={chartWidth}
                    height={chartHeight}
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
