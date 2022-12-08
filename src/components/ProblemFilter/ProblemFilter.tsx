import {RadioButton} from '@gravity-ui/uikit';

import {ALL, PROBLEMS, IProblemFilterValues} from '../../utils/constants';

interface ProblemFilterProps {
    value: IProblemFilterValues;
    onChange: (value: string) => void;
    className?: string;
}

export const ProblemFilter = ({value, onChange, className}: ProblemFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange} className={className}>
            <RadioButton.Option value={ALL}>{ALL}</RadioButton.Option>
            <RadioButton.Option value={PROBLEMS}>{PROBLEMS}</RadioButton.Option>
        </RadioButton>
    );
};
