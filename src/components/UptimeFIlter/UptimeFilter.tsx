import {RadioButton} from '@gravity-ui/uikit';

import {NodesUptimeFilterTitles, NodesUptimeFilterValues} from '../../utils/nodes';

interface UptimeFilterProps {
    value: NodesUptimeFilterValues;
    onChange: (value: NodesUptimeFilterValues) => void;
    className?: string;
}

export const UptimeFilter = ({value, onChange, className}: UptimeFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange} className={className}>
            <RadioButton.Option value={NodesUptimeFilterValues.All}>
                {NodesUptimeFilterTitles[NodesUptimeFilterValues.All]}
            </RadioButton.Option>
            <RadioButton.Option value={NodesUptimeFilterValues.SmallUptime}>
                {NodesUptimeFilterTitles[NodesUptimeFilterValues.SmallUptime]}
            </RadioButton.Option>
        </RadioButton>
    );
};
