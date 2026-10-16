import React from 'react';

import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import type {PreparedVDisk} from '../../utils/disks/types';
import {formatMetricPercent} from '../../utils/storageMetrics';
import {getVDiskCapacityItems} from '../DiskCapacityInfo/DiskCapacityInfo';
import {DiskFlagLabel} from '../DiskStatus/DiskStatus';
import {VDisk} from '../VDisk/VDisk';
import {VDiskCompactionRankLabel, VDiskFrontQueuesLabel} from '../VDiskStatus';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';

import {VDiskCopyableValue} from './VDiskCopyableValue';
import {getVDiskIdentityItems, getVDiskThroughputItems} from './getVDiskDetails';
import {vDiskInfoKeyset} from './i18n';

import './VDiskInfo.scss';

const b = cn('ydb-vdisk-info');

interface VDiskInfoProps {
    data?: PreparedVDisk;
    className?: string;
}

function getPageCapacityItems(data: PreparedVDisk, capacityMetricsEnabled: boolean) {
    const capacityItems = getVDiskCapacityItems(data, {capacityMetricsEnabled});
    if (!capacityMetricsEnabled) {
        capacityItems.push(
            {
                id: 'usage',
                name: vDiskInfoKeyset('usage'),
                content: formatMetricPercent(data.AllocatedPercent, 2),
            },
            {
                id: 'disk-space',
                name: vDiskInfoKeyset('space-status'),
                content: <DiskFlagLabel flag={data.DiskSpace} />,
            },
        );
    }
    return capacityItems;
}

export function VDiskInfo({data = {}, className}: VDiskInfoProps) {
    const [expanded, setExpanded] = React.useState(false);
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const donors = data.Replicated === false ? data.Donors : undefined;
    const disks = data.DonorMode ? [data.Recipient].filter((disk) => disk !== undefined) : donors;
    const runtimeItems: YDBDefinitionListItem[] = [
        {
            name: vDiskInfoKeyset('front-queues'),
            content: <VDiskFrontQueuesLabel flag={data.FrontQueues} />,
        },
        {
            name: vDiskInfoKeyset('field_compaction'),
            content: (
                <Flex gap={1} wrap="wrap">
                    <VDiskCompactionRankLabel
                        flag={data.SatisfactionRank?.FreshRank?.Flag}
                        rank="fresh"
                    />
                    <VDiskCompactionRankLabel
                        flag={data.SatisfactionRank?.LevelRank?.Flag}
                        rank="level"
                    />
                </Flex>
            ),
        },
        {
            name: vDiskInfoKeyset('has-unreadable-blobs'),
            content: isNil(data.HasUnreadableBlobs)
                ? EMPTY_DATA_PLACEHOLDER
                : vDiskInfoKeyset(data.HasUnreadableBlobs ? 'yes' : 'no'),
        },
        ...getVDiskThroughputItems(data),
        {
            name: vDiskInfoKeyset(data.DonorMode ? 'label_recipient' : 'donors'),
            content: disks?.length ? (
                <Flex gap={2} wrap="wrap">
                    {disks.map((disk) => (
                        <div className={b('disk')} key={disk.StringifiedId}>
                            <VDisk data={disk} withIcon />
                        </div>
                    ))}
                </Flex>
            ) : (
                vDiskInfoKeyset('no')
            ),
        },
    ];
    const capacityItems = getPageCapacityItems(data, capacityMetricsEnabled);
    const identityItems = getVDiskIdentityItems(data, {
        copyFields: ['guid', 'incarnation-guid', 'instance-guid'],
    }).map(({copyText, ...item}) => ({
        ...item,
        content: (
            <VDiskCopyableValue
                copyText={copyText === undefined ? undefined : String(copyText)}
                fieldName={item.name}
            >
                {item.content}
            </VDiskCopyableValue>
        ),
    }));

    return (
        <Flex
            className={b(null, className)}
            direction="column"
            alignItems="flex-start"
            gap={3}
            qa="vdisk-page-info"
        >
            <Flex className={b('metrics')} gap={6} gapRow={3} wrap="wrap">
                <YDBDefinitionList
                    items={runtimeItems}
                    nameMaxWidth={200}
                    wrapperClassName={b('column')}
                />
                {capacityItems.length > 0 && (
                    <YDBDefinitionList
                        items={capacityItems}
                        nameMaxWidth={200}
                        wrapperClassName={b('column')}
                    />
                )}
            </Flex>
            {expanded && (
                <YDBDefinitionList
                    items={identityItems}
                    nameMaxWidth={200}
                    wrapperClassName={b('identity')}
                />
            )}
            <Button
                size="m"
                view="outlined"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
            >
                {vDiskInfoKeyset(expanded ? 'action_show-less' : 'action_show-more')}
                <Icon data={expanded ? ChevronUp : ChevronDown} />
            </Button>
        </Flex>
    );
}
