import {Flex, SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {useStorageQueryParams} from '../useStorageQueryParams';

import {
    AllLegend,
    CompactionLegend,
    FrontQueuesLegend,
    PDiskDecommitLegend,
    PDiskDriveLegend,
    PDiskStateLegend,
    SpaceLegend,
    StateLegend,
} from './components';
import {PDisksGroupBy, VDisksGroupBy, b} from './constants';
import type {PDisksGroupByValue, VDisksGroupByValue} from './constants';
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

function getPDisksGroupByLabel(pdisksGroupBy: Exclude<PDisksGroupByValue, 'State'>) {
    switch (pdisksGroupBy) {
        case PDisksGroupBy.Space:
            return i18n('value_pdisks-space');
        case PDisksGroupBy.Drive:
            return i18n('value_pdisks-drive');
        case PDisksGroupBy.Decommit:
            return i18n('value_pdisks-decommit');
        case PDisksGroupBy.Maintenance:
            return i18n('value_pdisks-maintenance');
        case PDisksGroupBy.Device:
            return i18n('value_pdisks-device');
        case PDisksGroupBy.All:
            return i18n('value_pdisks-all');
        default:
            return null;
    }
}

function renderPDiskLegend(pdisksGroupBy: PDisksGroupByValue) {
    switch (pdisksGroupBy) {
        case PDisksGroupBy.State:
            return <PDiskStateLegend />;
        case PDisksGroupBy.Space:
            return <SpaceLegend selectionScope="pdisks" />;
        case PDisksGroupBy.Drive:
            return <PDiskDriveLegend />;
        case PDisksGroupBy.Decommit:
            return <PDiskDecommitLegend />;
        default:
            return <div>{getPDisksGroupByLabel(pdisksGroupBy)}</div>;
    }
}

export function StorageExpertModePanel({className}: StorageExpertModePanelProps) {
    const {vdisksGroupBy, pdisksGroupBy, handleVDisksGroupByChange, handlePDisksGroupByChange} =
        useStorageQueryParams();

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
            <Flex gap={3} alignItems="center">
                <Text variant="subheader-1">{i18n('label_pdisks')}</Text>
                <SegmentedRadioGroup
                    qa="storage-pdisks-expert-mode"
                    value={pdisksGroupBy}
                    onUpdate={handlePDisksGroupByChange}
                    size="s"
                >
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.State}>
                        {i18n('value_pdisks-state')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.Space}>
                        {i18n('value_pdisks-space')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.Drive}>
                        {i18n('value_pdisks-drive')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.Decommit}>
                        {i18n('value_pdisks-decommit')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.Maintenance}>
                        {i18n('value_pdisks-maintenance')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.Device}>
                        {i18n('value_pdisks-device')}
                    </SegmentedRadioGroup.Option>
                    <SegmentedRadioGroup.Option value={PDisksGroupBy.All}>
                        {i18n('value_pdisks-all')}
                    </SegmentedRadioGroup.Option>
                </SegmentedRadioGroup>
                <div data-qa="storage-pdisks-expert-mode-legend">
                    {renderPDiskLegend(pdisksGroupBy)}
                </div>
            </Flex>
        </div>
    );
}
