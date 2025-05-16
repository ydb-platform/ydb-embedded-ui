import type {ProgressTheme} from '@gravity-ui/uikit';
import {DefinitionList, Flex, Progress, Text} from '@gravity-ui/uikit';

import type {DiskErasureGroupsStats} from '../../../../../store/reducers/cluster/types';
import {formatBytes, getBytesSizeUnit} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import type {ProgressStatus} from '../../../../../utils/progress';
import {calculateProgressStatus} from '../../../../../utils/progress';
import i18n from '../../../i18n';

import './DiskGroupsStats.scss';

const b = cn('ydb-disk-groups-stats');

interface GroupsStatsPopupContentProps {
    stats: DiskErasureGroupsStats;
    storageType: string;
}

const calculatedStatusToProgressTheme: Record<ProgressStatus, ProgressTheme> = {
    good: 'success',
    warning: 'warning',
    danger: 'danger',
};

export function DiskGroupsStats({stats, storageType}: GroupsStatsPopupContentProps) {
    const {erasure, allocatedSize, availableSize} = stats;

    const sizeToConvert = getBytesSizeUnit(Math.max(allocatedSize, availableSize));

    const convertedAllocatedSize = formatBytes({value: allocatedSize, size: sizeToConvert});
    const convertedAvailableSize = formatBytes({value: availableSize, size: sizeToConvert});

    const usage = Math.floor((allocatedSize / (allocatedSize + availableSize)) * 100);

    const info = [
        {
            name: i18n('erasure'),
            content: erasure,
        },
        {
            name: i18n('allocated'),
            content: convertedAllocatedSize,
        },
        {
            name: i18n('available'),
            content: convertedAvailableSize,
        },
        {
            name: i18n('usage'),
            content: (
                <Flex gap={2} alignItems="center">
                    <Progress
                        theme={
                            calculatedStatusToProgressTheme[
                                calculateProgressStatus({fillWidth: usage})
                            ]
                        }
                        className={b('progress')}
                        value={usage}
                        size="s"
                    />
                    <Text color="secondary">{usage}%</Text>
                </Flex>
            ),
        },
    ];
    return (
        <Flex direction="column" gap={3} className={b()}>
            <Text variant="body-2">
                {storageType}{' '}
                <Text color="secondary" variant="body-2">
                    {`${formatNumber(stats.createdGroups)} ${i18n('context_of')} ${formatNumber(stats.totalGroups)}`}
                </Text>
            </Text>
            <DefinitionList nameMaxWidth={160}>
                {info.map(({name, content}) => (
                    <DefinitionList.Item key={name} name={name}>
                        {content}
                    </DefinitionList.Item>
                ))}
            </DefinitionList>
        </Flex>
    );
}
