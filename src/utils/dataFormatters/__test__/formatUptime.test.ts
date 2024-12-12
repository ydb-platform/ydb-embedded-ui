import {EMPTY_DATA_PLACEHOLDER} from '../../constants';
import {UNBREAKABLE_GAP} from '../../utils';
import {
    formatUptimeInSeconds,
    getDowntimeFromDateFormatted,
    getUptimeFromDateFormatted,
} from '../dataFormatters';

describe('getUptimeFromDateFormatted', () => {
    it('should calculate and format uptime', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 7_200_000)).toBe('1:00:00');
    });
    it('should return 0 if dateFrom after dateTo', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0s');
    });
});
describe('getDowntimeFromDateFormatted', () => {
    it('should calculate and format downtime as -uptime', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 7_200_000)).toBe('-1:00:00');
    });
    it('should not add sign if downtime is 0', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 3_600_000)).toBe('0s');
    });
    it('should return 0 if dateFrom after dateTo', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0s');
    });
});
describe('formatUptimeInSeconds', () => {
    const M = 60;
    const H = 60 * M;
    const D = 24 * H;

    it('should return days if value is more than 24h', () => {
        expect(formatUptimeInSeconds(D)).toBe('1d' + UNBREAKABLE_GAP + '00:00:00');
        expect(formatUptimeInSeconds(D + H + M + 12)).toBe('1d' + UNBREAKABLE_GAP + '01:01:12');
        expect(formatUptimeInSeconds(12 * D + 12 * H + 12 * M + 12)).toBe(
            '12d' + UNBREAKABLE_GAP + '12:12:12',
        );
        expect(formatUptimeInSeconds(1234 * D + 12 * H + 12 * M + 12)).toBe(
            '1234d' + UNBREAKABLE_GAP + '12:12:12',
        );
    });
    it('should return hours if value is less than 24h', () => {
        expect(formatUptimeInSeconds(H + M + 12)).toBe('1:01:12');
        expect(formatUptimeInSeconds(12 * H + 12 * M + 12)).toBe('12:12:12');
    });
    it('should return minutes if value is less than hour', () => {
        expect(formatUptimeInSeconds(M + 12)).toBe('1:12');
        expect(formatUptimeInSeconds(12 * M + 2)).toBe('12:02');
    });
    it('should return second if value is less than hour', () => {
        expect(formatUptimeInSeconds(12)).toBe('12s');
        expect(formatUptimeInSeconds(2)).toBe('2s');
    });
    it('should correctly process negative values', () => {
        expect(formatUptimeInSeconds(-0)).toBe('0s');
        expect(formatUptimeInSeconds(-12)).toBe('-12s');
        expect(formatUptimeInSeconds(-1 * (12 * M + 2))).toBe('-12:02');
        expect(formatUptimeInSeconds(-1 * (12 * H + 12 * M + 12))).toBe('-12:12:12');
        expect(formatUptimeInSeconds(-1 * (12 * D + 12 * H + 12 * M + 12))).toBe(
            '-12d' + UNBREAKABLE_GAP + '12:12:12',
        );
    });
    it('should return empty placeholder on NaN', () => {
        expect(formatUptimeInSeconds(Number.NaN)).toBe(EMPTY_DATA_PLACEHOLDER);
    });
});
