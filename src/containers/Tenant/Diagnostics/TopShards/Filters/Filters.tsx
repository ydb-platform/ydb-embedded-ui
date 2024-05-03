import {RadioButton} from '@gravity-ui/uikit';

import type {DateRangeValues} from '../../../../../components/DateRange';
import {DateRange} from '../../../../../components/DateRange';
import {EShardsWorkloadMode} from '../../../../../store/reducers/shardsWorkload/types';
import type {ShardsWorkloadFilters} from '../../../../../store/reducers/shardsWorkload/types';
import {isEnumMember} from '../../../../../utils/typecheckers';
import {b} from '../TopShards';
import i18n from '../i18n';

import './Filters.scss';

interface FiltersProps {
    value: ShardsWorkloadFilters;
    onChange: (value: Partial<ShardsWorkloadFilters>) => void;
    className?: string;
}

export const Filters = ({value, onChange, className}: FiltersProps) => {
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
        <div className={b('filters', className)}>
            <RadioButton value={value.mode} onUpdate={handleModeChange}>
                <RadioButton.Option value={EShardsWorkloadMode.Immediate}>
                    {i18n('filters.mode.immediate')}
                </RadioButton.Option>
                <RadioButton.Option value={EShardsWorkloadMode.History}>
                    {i18n('filters.mode.history')}
                </RadioButton.Option>
            </RadioButton>
            <DateRange from={from} to={to} onChange={handleDateRangeChange} />
        </div>
    );
};
