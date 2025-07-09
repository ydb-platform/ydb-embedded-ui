import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {ProblemFilterValues} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';

interface ProblemFilterProps {
    value: ProblemFilterValue;
    onChange: (value: ProblemFilterValue) => void;
    className?: string;
}

export const ProblemFilter = ({value, onChange, className}: ProblemFilterProps) => {
    return (
        <SegmentedRadioGroup value={value} onUpdate={onChange} className={className}>
            <SegmentedRadioGroup.Option value={ProblemFilterValues.ALL}>
                {ProblemFilterValues.ALL}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={ProblemFilterValues.PROBLEMS}>
                {ProblemFilterValues.PROBLEMS}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
};
