import React from 'react';

import ChartKit, {settings} from '@gravity-ui/chartkit';
import type {YagrWidgetData} from '@gravity-ui/chartkit/yagr';
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
    const {dataType, scaleRange, showLegend} = options;
    const defaultDataFormatter = getDefaultDataFormatter(dataType);

    const isDataEmpty = !data.metrics.length;

    const graphs: YagrWidgetData['data']['graphs'] = data.metrics.map((metric, index) => {
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
            legend: {
                show: showLegend,
            },
        },
    };
};

const emptyChartData: PreparedMetricsData = {timeline: [], metrics: []};

interface DiagnosticsChartProps {
    database: string;

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

    /** Remove border from chart */
    noBorder?: boolean;

    /** Make chart take full width of container */
    fullWidth?: boolean;

    /** Render custom toolbar content to the right of chart title */
    renderChartToolbar?: () => React.ReactNode;
}

export const MetricChart = ({
    database,
    metrics,
    timeFrame = '1h',
    autorefresh,
    width = 400,
    height = width / 1.5,
    chartOptions,
    onChartDataStatusChange,
    isChartVisible,
    noBorder,
    fullWidth,
    renderChartToolbar,
}: DiagnosticsChartProps) => {
    // Use a reasonable default for maxDataPoints when fullWidth is true
    const effectiveWidth = fullWidth ? 600 : width;
    const maxDataPoints = effectiveWidth / 2;

    const {currentData, error, isFetching, status} = chartApi.useGetChartDataQuery(
        // maxDataPoints param is calculated based on width
        // should be width > maxDataPoints to prevent points that cannot be selected
        // more px per dataPoint - easier to select, less - chart is smoother
        {
            database,
            metrics,
            timeFrame,
            maxDataPoints,
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
            className={b({noBorder})}
            style={{
                height,
                width: fullWidth ? '100%' : width,
            }}
        >
            {renderChartToolbar?.()}
            {renderContent()}
        </div>
    );
};
