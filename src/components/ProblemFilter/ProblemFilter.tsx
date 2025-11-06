import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import i18n from './i18n';

interface ProblemFilterProps {
    value: boolean;
    onChange: (value: boolean) => void;
    className?: string;
}

export function ProblemFilter({value, onChange, className}: ProblemFilterProps) {
    const handleValueChange = (value: string) => {
        onChange(value === 'true');
    };

    return (
        <SegmentedRadioGroup
            value={value.toString()}
            onUpdate={handleValueChange}
            className={className}
        >
            <SegmentedRadioGroup.Option value={'false'}>{i18n('all')}</SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={'true'}>
                {i18n('with-problems')}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
}
