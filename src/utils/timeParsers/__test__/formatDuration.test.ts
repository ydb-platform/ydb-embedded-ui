import {formatDurationToShortTimeFormat} from '../formatDuration';
import i18n from '../i18n';

describe('formatDurationToShortTimeFormat', () => {
    // 1 - ms
    const timeWithMs = 123;
    const formattedTimeWithMs = i18n('ms', {seconds: 0, ms: 123});

    // 2 - seconds and ms
    const timeWithSecondsAndMsInMs = 12345;
    const formattedTimeWithSecondsAndMs = i18n('secMs', {seconds: 12, ms: 345});

    // 3 - minutes
    const timeWithMinutesInMs = 754567;
    const formattedTimeWithMinutes = i18n('minSec', {minutes: 12, seconds: 34});

    // 4 - hours
    const timeWithHoursInMs = 9245678;
    const formattedTimeWithHours = i18n('hoursMin', {hours: 2, minutes: 34});

    // 5 - days
    const timeWithDaysInMs = 439234123;
    const formattedTimeWithDays = i18n('daysHours', {days: 5, hours: 2});

    // 6 - zero
    const formattedZero = i18n('ms', {seconds: 0, ms: 0});

    test('should return ms on values less than second', () => {
        expect(formatDurationToShortTimeFormat(timeWithMs)).toEqual(formattedTimeWithMs);
    });
    test('should return seconds and ms', () => {
        expect(formatDurationToShortTimeFormat(timeWithSecondsAndMsInMs)).toEqual(
            formattedTimeWithSecondsAndMs,
        );
    });
    test('should return minutes and seconds', () => {
        expect(formatDurationToShortTimeFormat(timeWithMinutesInMs)).toEqual(
            formattedTimeWithMinutes,
        );
    });
    test('should return hours and minutes', () => {
        expect(formatDurationToShortTimeFormat(timeWithHoursInMs)).toEqual(formattedTimeWithHours);
    });
    test('should return days and hours', () => {
        expect(formatDurationToShortTimeFormat(timeWithDaysInMs)).toEqual(formattedTimeWithDays);
    });
    test('should process zero values', () => {
        expect(formatDurationToShortTimeFormat(0)).toEqual(formattedZero);
    });
});
