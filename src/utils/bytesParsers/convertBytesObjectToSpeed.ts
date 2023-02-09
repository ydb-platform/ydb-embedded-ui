import type {MultipleWindowsStat} from '../../types/api/consumer';

import {DAY_IN_SECONDS, HOUR_IN_SECONDS, MINUTE_IN_SECONDS} from '../constants';

export interface IProcessSpeedStats {
    perMinute: number;
    perHour: number;
    perDay: number;
}

/**
 * Convert data of type MultipleWindowsStat.
 * This data format is specific for describe_topic and describe_consumer endpoints
 */
export const convertBytesObjectToSpeed = (
    data: MultipleWindowsStat | undefined,
): IProcessSpeedStats => {
    return {
        perMinute:
            data && data.per_minute ? Math.round(Number(data.per_minute) / MINUTE_IN_SECONDS) : 0,
        perHour: data && data.per_hour ? Math.round(Number(data.per_hour) / HOUR_IN_SECONDS) : 0,
        perDay: data && data.per_day ? Math.round(Number(data.per_day) / DAY_IN_SECONDS) : 0,
    };
};
