import {RadioButton} from '@gravity-ui/uikit';

import {DateRange, DateRangeValues} from '../../../../../components/DateRange';

import {
    EShardsWorkloadMode,
    type IShardsWorkloadFilters,
} from '../../../../../store/reducers/shardsWorkload/types';

import {isEnumMember} from '../../../../../utils/typecheckers';

import i18n from '../i18n';
import {b} from '../TopShards';

import './Filters.scss';

interface FiltersProps {
    value: IShardsWorkloadFilters;
    onChange: (value: Partial<IShardsWorkloadFilters>) => void;
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
