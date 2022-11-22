import {RadioButton} from '@gravity-ui/uikit';

import {NodesUptimeFilterValues, NodesUptimeFilterTitles} from '../../utils/nodes';

interface UptimeFilterProps {
    value: keyof typeof NodesUptimeFilterValues;
    onChange: (value: string) => void;
}

export const UptimeFilter = ({value, onChange}: UptimeFilterProps) => {
    return (
        <RadioButton value={value} onUpdate={onChange}>
            <RadioButton.Option value={NodesUptimeFilterValues.All}>
                {NodesUptimeFilterTitles[NodesUptimeFilterValues.All]}
            </RadioButton.Option>
            <RadioButton.Option value={NodesUptimeFilterValues.SmallUptime}>
                {NodesUptimeFilterTitles[NodesUptimeFilterValues.SmallUptime]}
            </RadioButton.Option>
        </RadioButton>
    );
};
