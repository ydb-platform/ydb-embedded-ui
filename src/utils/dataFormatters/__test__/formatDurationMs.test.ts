import {UNBREAKABLE_GAP} from '../../constants';
import {formatDurationMs} from '../dataFormatters';

describe('formatDurationMs', () => {
    const S = 1000;
    const M = 60 * S;
    const H = 60 * M;
    const D = 24 * H;

    describe('without withMs flag (delegates to formatDurationSeconds)', () => {
        test('should format days', () => {
            expect(formatDurationMs(D + H + M + 12 * S)).toBe('1d' + UNBREAKABLE_GAP + '01:01:12');
        });
        test('should format hours', () => {
            expect(formatDurationMs(2 * H + 30 * M + 15 * S)).toBe('2:30:15');
        });
        test('should format minutes', () => {
            expect(formatDurationMs(5 * M + 30 * S)).toBe('5:30');
        });
        test('should format seconds', () => {
            expect(formatDurationMs(45 * S)).toBe('45s');
        });
        test('should format zero', () => {
            expect(formatDurationMs(0)).toBe('0s');
        });
        test('should return undefined for undefined', () => {
            expect(formatDurationMs(undefined)).toBe(undefined);
        });
        test('should return undefined for NaN', () => {
            expect(formatDurationMs(Number.NaN)).toBe(undefined);
        });
    });

    describe('with withMs flag', () => {
        describe('less than 1 hour (mm:ss.SSS format)', () => {
            test('should format zero milliseconds', () => {
                expect(formatDurationMs(0, true)).toBe('00:00.000');
            });
            test('should format pure milliseconds (less than 1 second)', () => {
                expect(formatDurationMs(123, true)).toBe('00:00.123');
            });
            test('should format 1 millisecond', () => {
                expect(formatDurationMs(1, true)).toBe('00:00.001');
            });
            test('should format seconds with milliseconds', () => {
                expect(formatDurationMs(12 * S + 345, true)).toBe('00:12.345');
            });
            test('should format exact seconds (no fractional ms)', () => {
                expect(formatDurationMs(30 * S, true)).toBe('00:30.000');
            });
            test('should format 59 seconds', () => {
                expect(formatDurationMs(59 * S + 999, true)).toBe('00:59.999');
            });
            test('should format exact minute', () => {
                expect(formatDurationMs(M, true)).toBe('01:00.000');
            });
            test('should format minutes with seconds and ms', () => {
                expect(formatDurationMs(M + 12 * S + 345, true)).toBe('01:12.345');
            });
            test('should format multiple minutes', () => {
                expect(formatDurationMs(12 * M + 2 * S + 100, true)).toBe('12:02.100');
            });
            test('should format 59 minutes', () => {
                expect(formatDurationMs(59 * M + 59 * S + 999, true)).toBe('59:59.999');
            });
        });

        describe('hours (1 hour to less than 1 day)', () => {
            test('should format exact hour', () => {
                expect(formatDurationMs(H, true)).toBe('1h00:00.000');
            });
            test('should format hours with minutes, seconds and ms', () => {
                expect(formatDurationMs(H + 44 * M + 24 * S + 376, true)).toBe('1h44:24.376');
            });
            test('should format multiple hours', () => {
                expect(formatDurationMs(12 * H + 12 * M + 12 * S + 120, true)).toBe('12h12:12.120');
            });
            test('should format 23 hours', () => {
                expect(formatDurationMs(23 * H + 59 * M + 59 * S + 999, true)).toBe('23h59:59.999');
            });
        });

        describe('days (24 hours and more)', () => {
            test('should format exact day', () => {
                expect(formatDurationMs(D, true)).toBe('1d' + UNBREAKABLE_GAP + '00:00:00.000');
            });
            test('should format day with hours, minutes, seconds and ms', () => {
                expect(formatDurationMs(D + H + M + 12 * S + 345, true)).toBe(
                    '1d' + UNBREAKABLE_GAP + '01:01:12.345',
                );
            });
            test('should format multiple days', () => {
                expect(formatDurationMs(7 * D + H + M + 12 * S + 500, true)).toBe(
                    '7d' + UNBREAKABLE_GAP + '01:01:12.500',
                );
            });
            test('should format large number of days', () => {
                expect(formatDurationMs(1234 * D + 12 * H + 12 * M + 12 * S + 12, true)).toBe(
                    '1234d' + UNBREAKABLE_GAP + '12:12:12.012',
                );
            });
        });

        describe('negative values', () => {
            test('should format negative milliseconds', () => {
                expect(formatDurationMs(-500, true)).toBe('-00:00.500');
            });
            test('should format negative seconds', () => {
                expect(formatDurationMs(-12 * S - 345, true)).toBe('-00:12.345');
            });
            test('should format negative minutes', () => {
                expect(formatDurationMs(-1 * (12 * M + 2 * S + 100), true)).toBe('-12:02.100');
            });
            test('should format negative hours', () => {
                expect(formatDurationMs(-1 * (12 * H + 12 * M + 12 * S + 120), true)).toBe(
                    '-12h12:12.120',
                );
            });
            test('should format negative days', () => {
                expect(formatDurationMs(-1 * (D + H + M + 12 * S + 345), true)).toBe(
                    '-1d' + UNBREAKABLE_GAP + '01:01:12.345',
                );
            });
            test('should format -0 as positive zero', () => {
                expect(formatDurationMs(-0, true)).toBe('00:00.000');
            });
        });

        describe('edge cases', () => {
            test('should return undefined for undefined', () => {
                expect(formatDurationMs(undefined, true)).toBe(undefined);
            });
            test('should return undefined for NaN', () => {
                expect(formatDurationMs(Number.NaN, true)).toBe(undefined);
            });
        });
    });
});
