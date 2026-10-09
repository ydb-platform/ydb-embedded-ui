import {Flex, Text, Tooltip} from '@gravity-ui/uikit';

import {useBlobStorageCapacityMetricsEnabled} from '../../store/reducers/capabilities/hooks';
import type {PreparedStorageGroup} from '../../store/reducers/storage/types';
import {isNonEmptyValue} from '../../utils';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {formatMetricPercent, formatStorageMetricPair} from '../../utils/storageMetrics';
import {formatToMs} from '../../utils/timeParsers';
import {parseOptionalNonNegativeNumber} from '../../utils/utils';
import {
    getStorageGroupCapacityInfoItems,
    toDefinitionListItems,
} from '../DiskCapacityInfo/DiskCapacityInfo';
import diskCapacityInfoKeyset from '../DiskCapacityInfo/i18n';
import {StatusIcon} from '../StatusIcon/StatusIcon';
import type {YDBDefinitionListItem} from '../YDBDefinitionList/YDBDefinitionList';
import {YDBDefinitionList} from '../YDBDefinitionList/YDBDefinitionList';
import {CAPACITY_CONFIGURATION_HELP_TEXT} from '../capacityMetricsColumns/constants';
import {formatCapacityUnitCount} from '../capacityMetricsColumns/formatters';

import {storageGroupInfoKeyset} from './i18n';

import './StorageGroupInfo.scss';

const b = cn('ydb-storage-group-info');

interface StorageGroupInfoProps {
    data?: PreparedStorageGroup;
    className?: string;
}

export function StorageGroupInfo({data, className}: StorageGroupInfoProps) {
    const capacityMetricsEnabled = useBlobStorageCapacityMetricsEnabled();
    const {
        PoolName,
        GroupGeneration,
        ErasureSpecies,
        MissingDisks,
        LatencyPutTabletLogMs,
        LatencyPutUserDataMs,
        LatencyGetFastMs,
        Read,
        Write,
        GroupSizeInUnits,
        Used,
        Limit,
        Available,
        Usage,
        DiskSpace,
    } = data || {};
    const configurationItems: YDBDefinitionListItem[] = [
        {
            name: storageGroupInfoKeyset('field_pool-name'),
            content: PoolName ? (
                <Tooltip content={PoolName}>
                    <Text ellipsisLines={2} wordBreak="break-word">
                        {PoolName}
                    </Text>
                </Tooltip>
            ) : (
                EMPTY_DATA_PLACEHOLDER
            ),
        },
        ...(
            [
                [storageGroupInfoKeyset('group-generation'), GroupGeneration],
                [storageGroupInfoKeyset('erasure-species'), ErasureSpecies],
                [storageGroupInfoKeyset('missing-disks'), MissingDisks],
            ] as const
        ).map(([name, value]) => ({
            name,
            content: isNonEmptyValue(value) ? value : EMPTY_DATA_PLACEHOLDER,
        })),
    ];
    const latencyItems: YDBDefinitionListItem[] = (
        [
            [storageGroupInfoKeyset('latency-put-tablet-log'), LatencyPutTabletLogMs],
            [storageGroupInfoKeyset('latency-put-user-data'), LatencyPutUserDataMs],
            [storageGroupInfoKeyset('latency-get-fast'), LatencyGetFastMs],
        ] as const
    ).map(([name, value]) => {
        const latency = parseOptionalNonNegativeNumber(value);
        return {
            name,
            content: latency === undefined ? EMPTY_DATA_PLACEHOLDER : formatToMs(latency),
        };
    });
    const throughputItems: YDBDefinitionListItem[] = (
        [
            [storageGroupInfoKeyset('read-throughput'), Read],
            [storageGroupInfoKeyset('write-throughput'), Write],
        ] as const
    ).map(([name, value]) => ({
        name,
        content:
            formatBytes({
                value: parseOptionalNonNegativeNumber(value),
                size: 'mb',
                fixedDecimalPlaces: 2,
                withSpeedLabel: true,
            }) || EMPTY_DATA_PLACEHOLDER,
    }));
    const capacityItems: YDBDefinitionListItem[] = [];

    if (capacityMetricsEnabled) {
        capacityItems.push({
            name: diskCapacityInfoKeyset('field_group-size-in-units'),
            content: formatCapacityUnitCount(GroupSizeInUnits),
            note: CAPACITY_CONFIGURATION_HELP_TEXT.GroupSizeInUnits,
        });
    }
    capacityItems.push(
        {
            name: storageGroupInfoKeyset('used-space'),
            content: formatStorageMetricPair(Used, Limit, 2),
        },
        {
            name: storageGroupInfoKeyset('available'),
            content:
                formatBytes({
                    value: parseOptionalNonNegativeNumber(Available),
                    size: 'gb',
                    fixedDecimalPlaces: 2,
                }) || EMPTY_DATA_PLACEHOLDER,
        },
    );
    if (capacityMetricsEnabled) {
        capacityItems.push(...toDefinitionListItems(getStorageGroupCapacityInfoItems(data)));
    } else {
        capacityItems.push(
            {
                name: storageGroupInfoKeyset('usage'),
                content: formatMetricPercent(Usage, 2),
            },
            {
                name: storageGroupInfoKeyset('disk-space'),
                content: DiskSpace ? <StatusIcon status={DiskSpace} /> : EMPTY_DATA_PLACEHOLDER,
            },
        );
    }

    return (
        <Flex className={b(null, className)} wrap="wrap">
            <Flex direction="column" gap={4} className={b('configuration')}>
                <YDBDefinitionList items={configurationItems} nameMaxWidth={200} />
                <YDBDefinitionList items={latencyItems} nameMaxWidth={200} />
                <YDBDefinitionList items={throughputItems} nameMaxWidth={200} />
            </Flex>
            <YDBDefinitionList
                items={capacityItems}
                nameMaxWidth={200}
                wrapperClassName={b('capacity')}
            />
        </Flex>
    );
}
