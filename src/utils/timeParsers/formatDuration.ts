import {DAY_IN_SECONDS, HOUR_IN_SECONDS} from '../constants';

import i18n from './i18n';

/**
 * Process time difference in ms and returns formated time.
 * Only two major values are returned (days & hours, hours & minutes, minutes & seconds, etc.)
 */
export const formatDurationToShortTimeFormat = (value: number) => {
    const ms = value % 1000;
    let remain = Math.floor(value / 1000);

    const days = Math.floor(remain / DAY_IN_SECONDS);
    remain = remain % DAY_IN_SECONDS;

    const hours = Math.floor(remain / HOUR_IN_SECONDS);
    remain = remain % HOUR_IN_SECONDS;

    const minutes = Math.floor(remain / 60);
    remain = remain % 60;

    const seconds = remain;

    const duration = {
        days,
        hours,
        minutes,
        seconds,
        ms,
    };

    if (days > 0) {
        return i18n('daysHours', duration);
    }
    if (hours > 0) {
        return i18n('hoursMin', duration);
    }
    if (minutes > 0) {
        return i18n('minSec', duration);
    }
    if (seconds > 0) {
        return i18n('secMs', duration);
    }

    return i18n('ms', duration);
};
