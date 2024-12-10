import {getDowntimeFromDateFormatted, getUptimeFromDateFormatted} from '../dataFormatters';

describe('getUptimeFromDateFormatted', () => {
    it('should calculate and format uptime', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 7_200_000)).toBe('1:00:00');
    });
    it('should return 0 if dateFrom after dateTo', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0:00:00');
    });
});
describe('getDowntimeFromDateFormatted', () => {
    it('should calculate and format downtime as -uptime', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 7_200_000)).toBe('-1:00:00');
    });
    it('should not add sign if downtime is 0', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 3_600_000)).toBe('0:00:00');
    });
    it('should return 0 if dateFrom after dateTo', () => {
        expect(getDowntimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0:00:00');
    });
});
