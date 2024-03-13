import {useEffect, useMemo, useRef, useState} from 'react';
import cn from 'bem-cn-lite';

import {Select, SelectOption} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../components/EntityStatus/EntityStatus';

import {getUsageSeverityForEntityStatus} from '../utils';

import i18n from './i18n';
import './UsageFilter.scss';

export interface UsageFilterItem {
    threshold: number;
    count: number;
}

interface UsageFilterProps {
    className?: string;
    value?: string[];
    groups?: UsageFilterItem[];
    onChange?: (value: string[]) => void;
    debounce?: number;
}

const b = cn('usage-filter');

export const UsageFilter = (props: UsageFilterProps) => {
    const {className, value = [], groups = [], onChange, debounce = 200} = props;

    const [filterValue, setFilterValue] = useState(value);
    const timer = useRef<number>();

    useEffect(() => {
        // sync inner state with external value
        setFilterValue((prevValue) => {
            if (prevValue.join(',') !== value.join(',')) {
                return value;
            }

            return prevValue;
        });
    }, [value]);

    const options = useMemo(
        () =>
            groups.map(({threshold, count}) => ({
                value: String(threshold),
                text: `${threshold}%`,
                data: {count},
            })),
        [groups],
    );

    const handleUpdate = (newValue: string[]) => {
        setFilterValue(newValue);

        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            onChange?.(newValue);
        }, debounce);
    };

    const maxWidth = Math.max(...groups.map(({count}) => count));

    const renderOption = ({value: optionValue, data, text}: SelectOption) => (
        <div className={b('option')}>
            <EntityStatus
                className={b('option-title')}
                status={getUsageSeverityForEntityStatus(Number(optionValue))}
                name={text}
                size="xs"
            />
            <div className={b('option-meta')}>
                {i18n('groups_count', {count: data.count})}
                <div
                    className={b('option-bar')}
                    style={{width: `${(data.count / maxWidth) * 100}%`}}
                />
            </div>
        </div>
    );

    return (
        <Select
            className={b(null, className)}
            label={i18n('label')}
            value={filterValue}
            placeholder={i18n('default_value')}
            options={options}
            multiple
            onUpdate={handleUpdate}
            renderOption={renderOption}
            getOptionHeight={() => 50}
            popupWidth={280}
            disabled={groups.length === 0}
        />
    );
};
