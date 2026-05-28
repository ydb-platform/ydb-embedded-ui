import React from 'react';

import {Flex, SegmentedRadioGroup, Text} from '@gravity-ui/uikit';

import {cn} from '../../../utils/cn';
import {useStorageQueryParams} from '../useStorageQueryParams';

import {VDisksGroupBy} from './constants';
import i18n from './i18n';

import './StorageExpertModePanel.scss';

const b = cn('ydb-storage-expert-mode-panel');

interface StorageExpertModePanelProps {
    className?: string;
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
            </Flex>
        </div>
    );
}
