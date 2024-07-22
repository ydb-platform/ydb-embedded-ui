import type {RelativeRangeDatePickerProps} from '@gravity-ui/date-components';
import {dateTimeParse} from '@gravity-ui/date-utils';

import {getdatePickerSize} from '../utils';

describe('getdatePickerSize test', () => {
    it('should return the correct datepicker size', () => {
        const datePickerRangeValues = {
            start: {
                type: 'relative',
                value: 'now',
            },
            end: {
                type: 'relative',
                value: 'now',
            },
        } as RelativeRangeDatePickerProps['value'];
        expect(getdatePickerSize(datePickerRangeValues)).toEqual('s');
    });

    it('should return the correct datepicker size', () => {
        const datePickerRangeValues = {
            start: {
                type: 'absolute',
                value: dateTimeParse(Number(new Date().getTime())),
            },
            end: {
                type: 'relative',
                value: 'now + 1',
            },
        } as RelativeRangeDatePickerProps['value'];
        expect(getdatePickerSize(datePickerRangeValues)).toEqual('m');
    });

    it('should return the correct datepicker size', () => {
        const datePickerRangeValues = {
            start: {
                type: 'relative',
                value: 'now + 1',
            },
            end: {
                type: 'absolute',
                value: dateTimeParse(Number(new Date().getTime())),
            },
        } as RelativeRangeDatePickerProps['value'];
        expect(getdatePickerSize(datePickerRangeValues)).toEqual('m');
    });

    it('should return the correct datepicker size', () => {
        const datePickerRangeValues = {
            start: {
                type: 'absolute',
                value: dateTimeParse(Number(new Date().getTime())),
            },
            end: {
                type: 'absolute',
                value: dateTimeParse(Number(new Date().getTime())),
            },
        } as RelativeRangeDatePickerProps['value'];
        expect(getdatePickerSize(datePickerRangeValues)).toEqual('l');
    });
});
