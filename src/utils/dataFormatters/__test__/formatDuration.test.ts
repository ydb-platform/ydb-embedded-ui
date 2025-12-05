import {UNBREAKABLE_GAP} from '../../constants';
import {
    formatDurationSeconds,
    getDowntimeFromDateFormatted,
    getUptimeFromDateFormatted,
} from '../dataFormatters';

describe('getUptimeFromDateFormatted', () => {
    test('should calculate and format uptime', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 7_200_000)).toBe('1:00:00');
    });
    test('should return 0 if dateFrom after dateTo', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0s');
    });
});
describe('getDowntimeFromDateFormatted', () => {
    test('should calculate and format downtime as -uptime', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 7_200_000)).toBe('-1:00:00');
    });
    test('should not add sign if downtime is 0', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 3_600_000)).toBe('0s');
    });
    test('should return 0 if dateFrom after dateTo', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0s');
    });
});
describe('formatDurationSeconds', () => {
    const M = 60;
    const H = 60 * M;
    const D = 24 * H;

    test('should return days if value is more than 24h', () => {
        expect(formatDurationSeconds(24 * H)).toBe('1d' + UNBREAKABLE_GAP + '00:00:00');
        expect(formatDurationSeconds(D + H + M + 12)).toBe('1d' + UNBREAKABLE_GAP + '01:01:12');
        // 1 week
        expect(formatDurationSeconds(7 * D + H + M + 12)).toBe('7d' + UNBREAKABLE_GAP + '01:01:12');
        // 1 month
        expect(formatDurationSeconds(30 * D + 11 * H + 30 * M + 12)).toBe(
            '30d' + UNBREAKABLE_GAP + '11:30:12',
        );
        expect(formatDurationSeconds(1234 * D + 12 * H + 12 * M + 12)).toBe(
            '1234d' + UNBREAKABLE_GAP + '12:12:12',
        );
    });
    test('should return hours if value is less than 24h', () => {
        expect(formatDurationSeconds(H + M + 12)).toBe('1:01:12');
        expect(formatDurationSeconds(12 * H + 12 * M + 12)).toBe('12:12:12');
    });
    test('should return minutes if value is less than hour', () => {
        expect(formatDurationSeconds(M + 12)).toBe('1:12');
        expect(formatDurationSeconds(12 * M + 2)).toBe('12:02');
    });
    test('should return second if value is less than hour', () => {
        expect(formatDurationSeconds(12)).toBe('12s');
        expect(formatDurationSeconds(2)).toBe('2s');
    });
    test('should correctly process negative values', () => {
        expect(formatDurationSeconds(-0)).toBe('0s');
        expect(formatDurationSeconds(-12)).toBe('-12s');
        expect(formatDurationSeconds(-1 * (12 * M + 2))).toBe('-12:02');
        expect(formatDurationSeconds(-1 * (12 * H + 12 * M + 12))).toBe('-12:12:12');
        expect(formatDurationSeconds(-1 * (12 * D + 12 * H + 12 * M + 12))).toBe(
            '-12d' + UNBREAKABLE_GAP + '12:12:12',
        );
    });
    test('should return empty placeholder on NaN', () => {
        expect(formatDurationSeconds(Number.NaN)).toBe(undefined);
    });
});
