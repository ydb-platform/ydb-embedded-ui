import React from 'react';

import type {
    RelativeRangeDatePickerProps,
    RelativeRangeDatePickerValue,
} from '@gravity-ui/date-components';
import {DEFAULT_TIME_PRESETS, RelativeRangeDatePicker} from '@gravity-ui/date-components';

import {cn} from '../../utils/cn';

import i18n from './i18n';
import {fromDateRangeValues, getdatePickerSize, toDateRangeValues} from './utils';

import './DateRange.scss';

const b = cn('date-range');

export interface DateRangeValues {
    /** ms from epoch or special values like now, 1h, 1m, etc*/
    from?: string;
    /** ms from epoch or special values like now, 1h, 1m, etc*/
    to?: string;
}

interface DateRangeProps extends DateRangeValues {
    className?: string;
    defaultValue?: RelativeRangeDatePickerValue;
    onChange?: (value: DateRangeValues) => void;
}

export const DateRange = ({from, to, className, defaultValue, onChange}: DateRangeProps) => {
    const handleUpdate = React.useCallback<NonNullable<RelativeRangeDatePickerProps['onUpdate']>>(
        (pickerValue) => onChange?.(toDateRangeValues(pickerValue)),
        [onChange],
    );

    const value = React.useMemo(() => {
        if (!from && !to) {
            return undefined;
        }
        return fromDateRangeValues({from, to});
    }, [from, to]);

    // eslint-disable-next-line new-cap
    const timeZoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const currentValue = value || defaultValue;
    return (
        <div className={b(null, className)}>
            <RelativeRangeDatePicker
                withPresets
                className={b('range-input', {[getdatePickerSize(currentValue)]: true})}
                timeZone={timeZoneString}
                value={currentValue}
                allowNullableValues
                size="m"
                format={i18n('date-time-format')}
                onUpdate={handleUpdate}
                placeholder={`${i18n('date-time-format')} - ${i18n('date-time-format')}`}
                withApplyButton
                docs={DEFAULT_TIME_PRESETS}
                withHeader
            />
        </div>
    );
};
