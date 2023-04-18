import {RadioButton} from '@gravity-ui/uikit';

import {QueryModes} from '../../../../utils/query';

const QueryModeSelectorTitles = {
    [QueryModes.scan]: 'Scan',
    [QueryModes.script]: 'Script',
};

interface QueryModeSelectorProps {
    value: QueryModes;
    onChange: (value: string) => void;
    className?: string;
}

export const QueryModeSelector = ({value, onChange, className}: QueryModeSelectorProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange} className={className}>
            <RadioButton.Option value={QueryModes.script}>
                {QueryModeSelectorTitles[QueryModes.script]}
            </RadioButton.Option>
            <RadioButton.Option value={QueryModes.scan}>
                {QueryModeSelectorTitles[QueryModes.scan]}
            </RadioButton.Option>
        </RadioButton>
    );
};
