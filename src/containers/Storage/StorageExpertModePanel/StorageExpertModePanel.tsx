import {Flex, SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {useStorageQueryParams} from '../useStorageQueryParams';

import {
    AllLegend,
    CompactionLegend,
    FrontQueuesLegend,
    SpaceLegend,
    StateLegend,
} from './components';
import {VDisksGroupBy, b} from './constants';
import type {VDisksGroupByValue} from './constants';
import i18n from './i18n';

import './StorageExpertModePanel.scss';

interface StorageExpertModePanelProps {
    className?: string;
}

function renderLegend(vdisksGroupBy: VDisksGroupByValue) {
    switch (vdisksGroupBy) {
        case VDisksGroupBy.State:
            return <StateLegend />;
        case VDisksGroupBy.Space:
            return <SpaceLegend />;
        case VDisksGroupBy.FrontQueues:
            return <FrontQueuesLegend />;
        case VDisksGroupBy.Compaction:
            return <CompactionLegend />;
        case VDisksGroupBy.All:
            return <AllLegend />;
        default:
            return null;
    }
}

export function StorageExpertModePanel({className}: StorageExpertModePanelProps) {
    const {vdisksGroupBy, handleVDisksGroupByChange} = useStorageQueryParams();

    return (
        <div className={b(null, className)}>
            <Flex gap={3} alignItems="center">
                <Text variant="subheader-1">{i18n('label_vdisks')}</Text>
                <SegmentedRadioGroup
                    value={vdisksGroupBy}
                    onUpdate={handleVDisksGroupByChange}
                    size="s"
                >
                    <SegmentedRadioGroup.Option value={VDisksGroupBy.State}>
                        {i18n('value_state')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={VDisksGroupBy.Space}>
                        {i18n('value_space')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={VDisksGroupBy.FrontQueues}>
                        {i18n('value_front-queues')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={VDisksGroupBy.Compaction}>
                        {i18n('value_compaction')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={VDisksGroupBy.All}>
                        {i18n('value_all')}
                    </SegmentedRadioGroup.Option>
                </SegmentedRadioGroup>
                {renderLegend(vdisksGroupBy)}
            </Flex>
        </div>
    );
}
