import type {RelativeRangeDatePickerProps} from '@gravity-ui/date-components';
import {dateTimeParse} from '@gravity-ui/date-utils';

import {toDateRangeValues} from '../utils';

describe('To daterange values from datepicker values', () => {
    it('should return the correct datepicker values for to-absolute, from-absolute values', () => {
        const from = new Date('2020-01-01 19:00:00').getTime();
        const to = new Date('2022-01-01 19:00:00').getTime();

        const datePickerRangeValues = {
            start: {
                type: 'absolute',
                value: dateTimeParse(Number(from)),
            },
            end: {
                type: 'absolute',
                value: dateTimeParse(Number(to)),
            },
        } as RelativeRangeDatePickerProps['value'];

        const result = toDateRangeValues(datePickerRangeValues);

        expect(result).toEqual({
            from: String(from),
            to: String(to),
        });
    });
});

it('should return the correct daterange values for to-relative, from-absolute values', () => {
    const from = new Date('2020-01-01 19:00:00').getTime();
    const to = 'now';
    const datePickerRangeValues = {
        start: {
            type: 'absolute',
            value: dateTimeParse(Number(from)),
        },
        end: {
            type: 'relative',
            value: to,
        },
    } as RelativeRangeDatePickerProps['value'];

    const result = toDateRangeValues(datePickerRangeValues);

    expect(result).toEqual({
        from: String(from),
        to: to,
    });
});

it('should return the correct daterange values for from-relative, to-absolute values', () => {
    const from = 'now';
    const to = new Date('2022-01-01 19:00:00').getTime();
    const datePickerRangeValues = {
        start: {
            type: 'relative',
            value: from,
        },
        end: {
            type: 'absolute',
            value: dateTimeParse(Number(to)),
        },
    } as RelativeRangeDatePickerProps['value'];

    const result = toDateRangeValues(datePickerRangeValues);

    expect(result).toEqual({
        from: from,
        to: String(to),
    });
});

it('should return the correct daterange values for from-relative, to-relative values', () => {
    const from = 'now';
    const to = 'now + 1';
    const datePickerRangeValues = {
        start: {
            type: 'relative',
            value: from,
        },
        end: {
            type: 'relative',
            value: to,
        },
    } as RelativeRangeDatePickerProps['value'];

    const result = toDateRangeValues(datePickerRangeValues);

    expect(result).toEqual({
        from: from,
        to: to,
    });
});
