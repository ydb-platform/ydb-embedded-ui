import {TIMEFRAMES, type TimeFrame} from '../../utils/timeframes';
import type {MetricDescription} from './types';

interface GetChartDataParams {
    metrics: MetricDescription[];
    timeFrame: TimeFrame;
    maxDataPoints: number;
}

export const getChartData = async ({metrics, timeFrame, maxDataPoints}: GetChartDataParams) => {
    const targetString = metrics.map((metric) => `target=${metric.target}`).join('&');

    const until = Math.round(Date.now() / 1000);
    const from = until - TIMEFRAMES[timeFrame];

    return window.api.getChartData(
        {target: targetString, from, until, maxDataPoints},
        {concurrentId: `getChartData|${targetString}`},
    );
};
