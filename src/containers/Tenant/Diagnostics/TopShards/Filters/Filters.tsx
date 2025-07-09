import React from 'react';

import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import type {DateRangeValues} from '../../../../../components/DateRange';
import {DateRange} from '../../../../../components/DateRange';
import {EShardsWorkloadMode} from '../../../../../store/reducers/shardsWorkload/types';
import type {ShardsWorkloadFilters} from '../../../../../store/reducers/shardsWorkload/types';
import {isEnumMember} from '../../../../../utils/typecheckers';
import i18n from '../i18n';

interface FiltersProps {
    value: ShardsWorkloadFilters;
    onChange: (value: Partial<ShardsWorkloadFilters>) => void;
    className?: string;
}

const DEFAULT_TIME_FILTER_VALUE = {
    start: {
        value: 'now-1h',
        type: 'relative',
    },
    end: {
        value: 'now',
        type: 'relative',
    },
} as const;

export const Filters = ({value, onChange}: FiltersProps) => {
    const handleModeChange = (mode: string) => {
        if (!isEnumMember(EShardsWorkloadMode, mode)) {
            const values = Object.values(EShardsWorkloadMode).join(', ');
            throw new Error(`Unexpected TopShards mode "${mode}". Should be one of: ${values}`);
        }

        onChange({mode});
    };

    const handleDateRangeChange = (dateRange: DateRangeValues) => {
        onChange({
            mode: EShardsWorkloadMode.History,
            ...dateRange,
        });
    };

    const from = value.mode === EShardsWorkloadMode.Immediate ? undefined : value.from;
    const to = value.mode === EShardsWorkloadMode.Immediate ? undefined : value.to;

    return (
        <React.Fragment>
            <SegmentedRadioGroup value={value.mode} onUpdate={handleModeChange}>
                <SegmentedRadioGroup.Option value={EShardsWorkloadMode.Immediate}>
                    {i18n('filters.mode.immediate')}
                </SegmentedRadioGroup.Option>
                <SegmentedRadioGroup.Option value={EShardsWorkloadMode.History}>
                    {i18n('filters.mode.history')}
                </SegmentedRadioGroup.Option>
            </SegmentedRadioGroup>
            <DateRange
                from={from}
                to={to}
                onChange={handleDateRangeChange}
                defaultValue={DEFAULT_TIME_FILTER_VALUE}
            />
        </React.Fragment>
    );
};
