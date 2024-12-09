import {getUptimeFromDateFormatted} from '../dataFormatters';

describe('getUptimeFromDateFormatted', () => {
    it('should calculate and format uptime', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 7_200_000)).toBe('1:00:00');
    });
    it('should return 0 if dateFrom after dateTo', () => {
        expect(getUptimeFromDateFormatted(3_600_000, 3_599_000)).toBe('0:00:00');
    });
});
