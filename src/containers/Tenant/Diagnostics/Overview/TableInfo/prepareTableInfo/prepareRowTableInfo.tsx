import {Label} from '@gravity-ui/uikit';

import type {YDBDefinitionListItem} from '../../../../../../components/YDBDefinitionList/YDBDefinitionList';
import type {TPartitionConfig, TTTLSettings} from '../../../../../../types/api/schema';
import {formatBytes} from '../../../../../../utils/bytesParsers';
import {DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES, READ_REPLICAS_MODE} from '../constants';
import i18n from '../i18n';

import {prepareTTL} from './prepareTTL';
import type {PartitionProgressConfig} from './renderHelpers';
import {
    renderBloomFilterStatusIcon,
    renderCompressionGroupsContent,
    renderCurrentPartitionsContent,
} from './renderHelpers';

/**
 * Prepares general information sections for row tables (EPathTypeTable)
 */
export function prepareRowTableGeneralInfo(
    PartitionConfig: TPartitionConfig,
    Progress: PartitionProgressConfig,
    TTLSettings?: TTTLSettings,
) {
    const {PartitioningPolicy = {}, FollowerGroups, EnableFilterByKey} = PartitionConfig;

    const left: YDBDefinitionListItem[] = [];
    const right: YDBDefinitionListItem[] = [];

    const splitByLoadEnabled = Boolean(PartitioningPolicy?.SplitByLoadSettings?.Enabled);

    const partitioningByLoad = splitByLoadEnabled ? (
        <Label>{i18n('value_enabled')}</Label>
    ) : (
        <Label theme="unknown">{i18n('value_disabled')}</Label>
    );

    // For splitting by size: it always will be split by 2 GB if user doesn't set anything else
    const splitSizeBytes = PartitioningPolicy.SizeToSplit ?? DEFAULT_PARTITION_SIZE_TO_SPLIT_BYTES;

    left.push(
        {
            name: i18n('field_current-partitions'),
            content: renderCurrentPartitionsContent(Progress),
        },
        {
            name: i18n('field_partitioning-by-size'),
            content: <Label>{formatBytes({value: splitSizeBytes})}</Label>,
        },
        {name: i18n('field_partitioning-by-load'), content: partitioningByLoad},
    );

    if (TTLSettings) {
        const ttlInfo = prepareTTL(TTLSettings);
        if (ttlInfo) {
            left.push(ttlInfo);
        }
    }

    let readReplicasConfig;
    if (FollowerGroups && FollowerGroups.length) {
        const {RequireAllDataCenters, FollowerCountPerDataCenter, FollowerCount} =
            FollowerGroups[0];

        readReplicasConfig =
            RequireAllDataCenters && FollowerCountPerDataCenter
                ? `${READ_REPLICAS_MODE.PER_AZ}: ${FollowerCount}`
                : `${READ_REPLICAS_MODE.ANY_AZ}: ${FollowerCount}`;
    } else {
        readReplicasConfig = i18n('value_no');
    }

    right.push(
        {name: i18n('field_read-replicas'), content: readReplicasConfig},
        {
            name: i18n('field_bloom-filter'),
            content: renderBloomFilterStatusIcon(Boolean(EnableFilterByKey)),
        },
        {
            name: i18n('field_compression-groups'),
            content: renderCompressionGroupsContent(PartitionConfig),
        },
    );

    return {left, right};
}
