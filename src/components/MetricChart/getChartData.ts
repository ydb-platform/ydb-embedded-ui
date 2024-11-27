import {TIMEFRAMES} from '../../utils/timeframes';
import type {TimeFrame} from '../../utils/timeframes';

import type {MetricDescription} from './types';

export interface GetChartDataParams {
    database: string;
    metrics: MetricDescription[];
    timeFrame: TimeFrame;
    maxDataPoints: number;
}

export const getChartData = async (
    {database, metrics, timeFrame, maxDataPoints}: GetChartDataParams,
    {signal}: {signal?: AbortSignal} = {},
) => {
    const targetString = metrics.map((metric) => `target=${metric.target}`).join('&');

    const until = Math.round(Date.now() / 1000);
    const from = until - TIMEFRAMES[timeFrame];

    return window.api.viewer.getChartData(
        {target: targetString, from, until, maxDataPoints, database},
        {signal},
    );
};
