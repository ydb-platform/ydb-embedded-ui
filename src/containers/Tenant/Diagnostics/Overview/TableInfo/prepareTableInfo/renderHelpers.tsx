import {CircleCheckFill, CircleQuestion, CircleXmarkFill} from '@gravity-ui/icons';
import {Flex, Icon, Label, Popover} from '@gravity-ui/uikit';

import type {TPartitionConfig} from '../../../../../../types/api/schema';
import {formatNumber} from '../../../../../../utils/dataFormatters/dataFormatters';
import {b} from '../TableInfo';
import i18n from '../i18n';

export interface PartitionProgressConfig {
    minPartitions: number;
    maxPartitions?: number;
    partitionsCount: number;
}

/**
 * Renders the current partitions count with visual indicators for out-of-range values
 */
export const renderCurrentPartitionsContent = (progress: PartitionProgressConfig) => {
    const {minPartitions, maxPartitions, partitionsCount} = progress;

    const isBelowMin = partitionsCount < minPartitions;
    const isAboveMax = maxPartitions !== undefined && partitionsCount > maxPartitions;

    const isOutOfRange = isBelowMin || isAboveMax;

    const content = isBelowMin
        ? i18n('hint_current-partitions-below-limits')
        : i18n('hint_current-partitions-exceeds-limits');

    return (
        <Label theme={isOutOfRange ? 'danger' : undefined}>
            <Flex gap="2" alignItems="center">
                {formatNumber(partitionsCount)}
                {isOutOfRange && (
                    <Popover
                        placement="auto-start"
                        content={content}
                        className={b('partitions-popover')}
                    >
                        <Icon data={CircleQuestion} />
                    </Popover>
                )}
            </Flex>
        </Label>
    );
};

/**
 * Renders bloom filter status icon (enabled/disabled)
 */
export const renderBloomFilterStatusIcon = (value: boolean) => {
    return (
        <span
            aria-label={value ? i18n('value_enabled') : i18n('value_disabled')}
            className={b('status-icon', {state: value ? 'enabled' : 'disabled'})}
        >
            <Icon data={value ? CircleCheckFill : CircleXmarkFill} size={16} />
        </span>
    );
};

/**
 * Renders compression groups/column families list
 */
export const renderCompressionGroupsContent = (partitionConfig: TPartitionConfig) => {
    const families = partitionConfig.ColumnFamilies;

    if (!Array.isArray(families) || families.length === 0) {
        return <span>{i18n('value_some-groups')}</span>;
    }

    return (
        <Flex direction="column" gap={1}>
            {families.map((family, index) => {
                const name = family?.Name ? String(family.Name) : i18n('value_default');
                const id = family.Id ?? `${name}-${index}`;

                return <span key={id}>{name}</span>;
            })}
        </Flex>
    );
};
