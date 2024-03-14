import {useCallback, useEffect, useReducer, useRef} from 'react';

import {YagrPlugin, YagrSeriesData, YagrWidgetData} from '@gravity-ui/chartkit/yagr';
import ChartKit, {settings} from '@gravity-ui/chartkit';

import type {IResponseError} from '../../types/api/error';
import type {TimeFrame} from '../../utils/timeframes';
import {useAutofetcher} from '../../utils/hooks';

import {cn} from '../../utils/cn';

import {Loader} from '../Loader';
import {ResponseError} from '../Errors/ResponseError';

import type {
    ChartOptions,
    MetricDescription,
    OnChartDataStatusChange,
    PreparedMetricsData,
} from './types';
import {convertResponse} from './convertReponse';
import {getDefaultDataFormatter} from './getDefaultDataFormatter';
import {getChartData} from './getChartData';
import {
    chartReducer,
    initialChartState,
    setChartData,
    setChartDataLoading,
    setChartDataWasNotLoaded,
    setChartError,
} from './reducer';
import {colorHexToRGBA, colors} from './colors';
import i18n from './i18n';

import './MetricChart.scss';

const b = cn('ydb-metric-chart');

settings.set({plugins: [YagrPlugin]});

const prepareWidgetData = (
    data: PreparedMetricsData,
    options: ChartOptions = {},
): YagrWidgetData => {
    const {dataType} = options;
    const defaultDataFormatter = getDefaultDataFormatter(dataType);

    const isDataEmpty = !data.metrics.length;

    const graphs: YagrSeriesData[] = data.metrics.map((metric, index) => {
        const lineColor = metric.color || colors[index];
        const color = colorHexToRGBA(lineColor, 0.1);

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

interface DiagnosticsChartProps {
    database: string;

    title?: string;
    metrics: MetricDescription[];
    timeFrame?: TimeFrame;

    autorefresh?: boolean;

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
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const [{loading, wasLoaded, data, error}, dispatch] = useReducer(
        chartReducer,
        initialChartState,
    );

    useEffect(() => {
        if (error) {
            return onChartDataStatusChange?.('error');
        }
        if (loading && !wasLoaded) {
            return onChartDataStatusChange?.('loading');
        }
        if (!loading && wasLoaded) {
            return onChartDataStatusChange?.('success');
        }

        return undefined;
    }, [loading, wasLoaded, error, onChartDataStatusChange]);

    const fetchChartData = useCallback(
        async (isBackground: boolean) => {
            dispatch(setChartDataLoading());

            if (!isBackground) {
                dispatch(setChartDataWasNotLoaded());
            }

            try {
                // maxDataPoints param is calculated based on width
                // should be width > maxDataPoints to prevent points that cannot be selected
                // more px per dataPoint - easier to select, less - chart is smoother
                const response = await getChartData({
                    database,
                    metrics,
                    timeFrame,
                    maxDataPoints: width / 2,
                });

                // Hack to prevent setting value to state, if component unmounted
                if (!mounted.current) {
                    return;
                }

                // Response could be a plain html for ydb versions without charts support
                // Or there could be an error in response with 200 status code
                // It happens when request is OK, but chart data cannot be returned due to some reason
                // Example: charts are not enabled in the DB ('GraphShard is not enabled' error)
                if (Array.isArray(response)) {
                    const preparedData = convertResponse(response, metrics);
                    dispatch(setChartData(preparedData));
                } else {
                    const err = {
                        statusText:
                            typeof response === 'string' ? i18n('not-supported') : response.error,
                    };

                    throw err;
                }
            } catch (err) {
                if (!mounted.current) {
                    return;
                }

                dispatch(setChartError(err as IResponseError));
            }
        },
        [database, metrics, timeFrame, width],
    );

    useAutofetcher(fetchChartData, [fetchChartData], autorefresh);

    const convertedData = prepareWidgetData(data, chartOptions);

    const renderContent = () => {
        if (loading && !wasLoaded) {
            return <Loader />;
        }

        if (!isChartVisible) {
            return null;
        }

        return (
            <div className={b('chart')}>
                <ChartKit type="yagr" data={convertedData} />
                {error && <ResponseError className={b('error')} error={error} />}
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
