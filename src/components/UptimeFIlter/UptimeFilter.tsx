import {SegmentedRadioGroup} from '@gravity-ui/uikit';

import {NodesUptimeFilterTitles, NodesUptimeFilterValues} from '../../utils/nodes';

interface UptimeFilterProps {
    value: NodesUptimeFilterValues;
    onChange: (value: NodesUptimeFilterValues) => void;
    className?: string;
}

export const UptimeFilter = ({value, onChange, className}: UptimeFilterProps) => {
    return (
        <SegmentedRadioGroup value={value} onUpdate={onChange} className={className}>
            <SegmentedRadioGroup.Option value={NodesUptimeFilterValues.All}>
                {NodesUptimeFilterTitles[NodesUptimeFilterValues.All]}
            </SegmentedRadioGroup.Option>
            <SegmentedRadioGroup.Option value={NodesUptimeFilterValues.SmallUptime}>
                {NodesUptimeFilterTitles[NodesUptimeFilterValues.SmallUptime]}
            </SegmentedRadioGroup.Option>
        </SegmentedRadioGroup>
    );
};
