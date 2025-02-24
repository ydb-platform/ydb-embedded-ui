import {dateTimeParse} from '@gravity-ui/date-utils';

import {fromDateRangeValues} from '../utils';

describe('From daterange values to datepicker values', () => {
    test('should return the correct datepicker values for to-absolute, from-absolute values', () => {
        const from = new Date('2020-01-01 19:00:00').getTime();
        const to = new Date('2022-01-01 19:00:00').getTime();

        const dateRangeValues = {
            from: String(from),
            to: String(to),
        };

        const result = fromDateRangeValues(dateRangeValues);

        expect(result).toEqual({
            start: {
                type: 'absolute',
                value: dateTimeParse(Number(from)),
            },
            end: {
                type: 'absolute',
                value: dateTimeParse(Number(to)),
            },
        });
    });

    test('should return the correct datepicker values for to-relative, from-absolute values', () => {
        const from = new Date('2020-01-01 19:00:00').getTime();
        const to = 'now';

        const dateRangeValues = {
            from: String(from),
            to: String(to),
        };

        const result = fromDateRangeValues(dateRangeValues);

        expect(result).toEqual({
            start: {
                type: 'absolute',
                value: dateTimeParse(Number(from)),
            },
            end: {
                type: 'relative',
                value: to,
            },
        });
    });

    test('should return the correct datepicker values for from-relative, to-absolute values', () => {
        const from = 'now';
        const to = new Date('2022-01-01 19:00:00').getTime();

        const dateRangeValues = {
            from: String(from),
            to: String(to),
        };

        const result = fromDateRangeValues(dateRangeValues);

        expect(result).toEqual({
            start: {
                type: 'relative',
                value: from,
            },
            end: {
                type: 'absolute',
                value: dateTimeParse(Number(to)),
            },
        });
    });

    test('should return the correct datepicker values for from-relative, to-relative values', () => {
        const from = 'now';
        const to = 'now + 1h';

        const dateRangeValues = {
            from: String(from),
            to: String(to),
        };

        const result = fromDateRangeValues(dateRangeValues);

        expect(result).toEqual({
            start: {
                type: 'relative',
                value: from,
            },
            end: {
                type: 'relative',
                value: to,
            },
        });
    });
});
