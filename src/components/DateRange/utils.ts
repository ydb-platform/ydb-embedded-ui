import type {RelativeRangeDatePickerProps} from '@gravity-ui/date-components';
import {dateTimeParse, isLikeRelative} from '@gravity-ui/date-utils';

import type {DateRangeValues} from './DateRange';

export function fromDateRangeValues(value: DateRangeValues): RelativeRangeDatePickerProps['value'] {
    const isFromRelative = isLikeRelative(value.from ?? '');
    const isToRelative = isLikeRelative(value.to ?? '');

    return {
        start: value.from
            ? {
                  type: isFromRelative ? 'relative' : 'absolute',
                  value: isFromRelative ? value.from : dateTimeParse(Number(value.from)),
              }
            : null,
        end: value.to
            ? {
                  type: isToRelative ? 'relative' : 'absolute',
                  value: isToRelative ? value.to : dateTimeParse(Number(value.to)),
              }
            : null,
    } as RelativeRangeDatePickerProps['value'];
}

export function toDateRangeValues(value: RelativeRangeDatePickerProps['value']): DateRangeValues {
    return {
        from:
            value?.start?.type === 'relative'
                ? value.start.value.toString()
                : String(dateTimeParse(value?.start?.value)?.valueOf()),
        to:
            value?.end?.type === 'relative'
                ? value.end.value.toString()
                : String(dateTimeParse(value?.end?.value)?.valueOf()),
    };
}

export function getdatePickerSize(value: RelativeRangeDatePickerProps['value']) {
    if (value?.start?.type === 'relative' && value?.end?.type === 'relative') {
        return 's';
    } else if (value?.start?.type === 'relative' || value?.end?.type === 'relative') {
        return 'm';
    }
    return 'l';
}
