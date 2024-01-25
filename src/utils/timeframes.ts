import {DAY_IN_SECONDS, HOUR_IN_SECONDS, MINUTE_IN_SECONDS} from './constants';

export const TIMEFRAMES = {
    '30m': 30 * MINUTE_IN_SECONDS,
    '1h': HOUR_IN_SECONDS,
    '1d': DAY_IN_SECONDS,
    '1w': 7 * DAY_IN_SECONDS,
} as const;

export type TimeFrame = keyof typeof TIMEFRAMES;
