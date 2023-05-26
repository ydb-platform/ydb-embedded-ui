import {RadioButton} from '@gravity-ui/uikit';

import type {ValueOf} from '../../types/common';
import {ProblemFilterValues} from '../../store/reducers/settings/settings';

interface ProblemFilterProps {
    value: ValueOf<typeof ProblemFilterValues>;
    onChange: (value: string) => void;
    className?: string;
}

export const ProblemFilter = ({value, onChange, className}: ProblemFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange} className={className}>
            <RadioButton.Option value={ProblemFilterValues.ALL}>
                {ProblemFilterValues.ALL}
            </RadioButton.Option>
            <RadioButton.Option value={ProblemFilterValues.PROBLEMS}>
                {ProblemFilterValues.PROBLEMS}
            </RadioButton.Option>
        </RadioButton>
    );
};
