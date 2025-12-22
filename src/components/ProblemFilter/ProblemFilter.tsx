import React from 'react';

import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import i18n from './i18n';

interface ProblemFilterProps {
    value: boolean;
    onChange: (value: boolean) => void;
    className?: string;
}

export function ProblemFilter({value, onChange, className}: ProblemFilterProps) {
    const handleValueChange = React.useCallback(
        (value: string) => {
            onChange(value === 'true');
        },
        [onChange],
    );

    return (
        <SegmentedRadioGroup
            value={value.toString()}
            onUpdate={handleValueChange}
            className={className}
        >
            <SegmentedRadioGroup.Option value={'false'}>
                {i18n('value_all')}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={'true'}>
                {i18n('value_with-problems')}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
}
