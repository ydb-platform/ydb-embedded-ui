import {RadioButton} from '@gravity-ui/uikit';

import {ProblemFilterValues} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';

interface ProblemFilterProps {
    value: ProblemFilterValue;
    onChange: (value: ProblemFilterValue) => void;
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
