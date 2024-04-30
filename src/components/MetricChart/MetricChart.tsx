import React from 'react';

import ChartKit, {settings} from '@gravity-ui/chartkit';
import type {YagrSeriesData, YagrWidgetData} from '@gravity-ui/chartkit/yagr';
import {YagrPlugin} from '@gravity-ui/chartkit/yagr';

import {cn} from '../../utils/cn';
import type {TimeFrame} from '../../utils/timeframes';
import {ResponseError} from '../Errors/ResponseError';
import {Loader} from '../Loader';

import {colorToRGBA, colors} from './colors';
import {getDefaultDataFormatter} from './getDefaultDataFormatter';
import {chartApi} from './reducer';
import type {
    ChartOptions,
    MetricDescription,
    OnChartDataStatusChange,
    PreparedMetricsData,
} from './types';

import './MetricChart.scss';

const b = cn('ydb-metric-chart');

settings.set({plugins: [YagrPlugin]});

const prepareWidgetData = (
    data: PreparedMetricsData,
    options: ChartOptions = {},
): YagrWidgetData => {
    const {dataType, scaleRange} = options;
    const defaultDataFormatter = getDefaultDataFormatter(dataType);

    const isDataEmpty = !data.metrics.length;

    const graphs: YagrSeriesData[] = data.metrics.map((metric, index) => {
        const lineColor = metric.color || colors[index];
        const color = colorToRGBA(lineColor, 0.1);

        return {
            id: metric.target,
            name: metric.title || metric.target,
            data: metric.data,
            formatter: defaultDataFormatter,

            lineColor,
            color,
            legendColorKey: 'lineColor',
        };
    });

    return {
        data: {
            timeline: data.timeline,
            graphs,
        },

        libraryConfig: {
            chart: {
                size: {
                    // When empty data chart is displayed without axes it have different paddings
                    // To compensate it, additional paddings are applied
                    padding: isDataEmpty ? [10, 0, 10, 0] : undefined,
                },
                series: {
                    type: 'area',
                    spanGaps: true,
                    lineWidth: 1.5,
                },
                select: {
                    zoom: false,
                },
            },
            scales: {
                y: {
                    type: 'linear',
                    range: 'nice',
                    min: scaleRange?.min || 0,
                    max: scaleRange?.max,
                },
            },
            axes: {
                y: {
                    values: defaultDataFormatter
                        ? (_, ticks) => ticks.map(defaultDataFormatter)
                        : undefined,
                },
            },
            tooltip: {
                show: true,
                tracking: 'sticky',
            },
        },
    };
};

const emptyChartData: PreparedMetricsData = {timeline: [], metrics: []};

interface DiagnosticsChartProps {
    database: string;

    title?: string;
    metrics: MetricDescription[];
    timeFrame?: TimeFrame;

    autorefresh?: number;

    height?: number;
    width?: number;

    chartOptions?: ChartOptions;

    onChartDataStatusChange?: OnChartDataStatusChange;

    /**
     * YAGR charts don't render correctly inside not visible elements\
     * So if chart is used inside component with 'display:none', it will be empty, when visibility change\
     * Pass isChartVisible prop to ensure proper chart render
     */
    isChartVisible?: boolean;
}

export const MetricChart = ({
    database,
    title,
    metrics,
    timeFrame = '1h',
    autorefresh,
    width = 400,
    height = width / 1.5,
    chartOptions,
    onChartDataStatusChange,
    isChartVisible,
}: DiagnosticsChartProps) => {
    const {currentData, error, isFetching, status} = chartApi.useGetChertDataQuery(
        {
            database,
            metrics,
            timeFrame,
            maxDataPoints: width / 2,
        },
        {pollingInterval: autorefresh},
    );

    const loading = isFetching && !currentData;

    React.useEffect(() => {
        return onChartDataStatusChange?.(status === 'fulfilled' ? 'success' : 'loading');
    }, [status, onChartDataStatusChange]);

    const convertedData = prepareWidgetData(currentData || emptyChartData, chartOptions);

    const renderContent = () => {
        if (loading) {
            return <Loader />;
        }

        if (!isChartVisible) {
            return null;
        }

        return (
            <div className={b('chart')}>
                <ChartKit type="yagr" data={convertedData} />
                {error ? <ResponseError className={b('error')} error={error} /> : null}
            </div>
        );
    };

    return (
        <div
            className={b(null)}
            style={{
                height,
                width,
            }}
        >
            <div className={b('title')}>{title}</div>
            {renderContent()}
        </div>
    );
};
