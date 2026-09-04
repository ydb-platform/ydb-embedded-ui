import React from 'react';

import {Card, Flex, HelpMark, Label, Text, Tooltip} from '@gravity-ui/uikit';

import {SegmentedProgress} from '../../../../../components/SegmentedProgress/SegmentedProgress';
import type {ClusterGroupsStats} from '../../../../../store/reducers/cluster/types';
import {cn} from '../../../../../utils/cn';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../../i18n';

import type {PreparedDiskGroupsStats, PreparedErasureGroupsStats} from './utils';
import {prepareClusterGroupsStats} from './utils';

import './DiskGroupsStats.scss';

const b = cn('ydb-disk-groups-stats');

const ERASURE_COLORS: Record<string, string> = {
    'block-4-2': 'var(--g-color-base-info-heavy)',
    'mirror-3-dc': 'var(--g-color-base-utility-heavy)',
    'mirror-3of4': 'var(--g-color-base-utility-heavy)',
    none: 'var(--g-color-base-neutral-heavy)',
};

function getErasureColor(erasure: string) {
    return ERASURE_COLORS[erasure] ?? 'var(--g-color-base-neutral-heavy)';
}

function formatGroups(count: number) {
    return i18n('value_groups', {
        count,
        formattedCount: formatNumber(count),
    });
}

function formatAvailableGroups({min, max}: PreparedDiskGroupsStats['availableGroups']) {
    if (min === max) {
        return formatGroups(min);
    }

    return i18n('value_available-groups-range', {
        min: formatNumber(min),
        max: formatNumber(max),
    });
}

function getErasureTooltip(stats: PreparedErasureGroupsStats) {
    return i18n('context_available-groups-by-erasure', {
        count: stats.availableGroups,
        formattedCount: formatNumber(stats.availableGroups),
        erasure: stats.erasure,
    });
}

function DiskGroupStats({stats}: {stats: PreparedDiskGroupsStats}) {
    const {allocatedGroups, availableGroups, diskType, erasures, progressTotalGroups} = stats;
    const progressValue = progressTotalGroups > 0 ? allocatedGroups / progressTotalGroups : 0;
    const progressPercent = progressValue * 100;
    const progressLabel = i18n('context_storage-group-allocation-progress', {
        diskType,
        percent: Math.round(progressPercent),
    });
    const availableGroupsContext = i18n('context_available-groups');

    const segments = erasures
        .filter(({createdGroups}) => createdGroups > 0)
        .map((erasureStats) => ({
            id: erasureStats.erasure,
            value: erasureStats.createdGroups,
            minWidth: 10,
            color: getErasureColor(erasureStats.erasure),
            className: b('progress-segment'),
            content: (
                <Tooltip content={getErasureTooltip(erasureStats)}>
                    <div
                        aria-label={getErasureTooltip(erasureStats)}
                        className={b('progress-segment-trigger')}
                        role="img"
                        tabIndex={0}
                    />
                </Tooltip>
            ),
        }));

    return (
        <Card view="filled" className={b('card')}>
            <Flex direction="column" gap={1}>
                <Flex direction="column" gap={2}>
                    <Flex justifyContent="space-between" alignItems="center" gap={2}>
                        <Text variant="subheader-1">{diskType}</Text>
                        <Label
                            theme="info"
                            value={
                                <Flex alignItems="center" gap={1}>
                                    {formatAvailableGroups(availableGroups)}
                                    <HelpMark
                                        iconSize="s"
                                        aria-label={i18n('action_show-available-groups-info', {
                                            diskType,
                                        })}
                                        className={b('available-help')}
                                        popoverProps={{placement: ['top', 'bottom']}}
                                    >
                                        {availableGroupsContext}
                                    </HelpMark>
                                </Flex>
                            }
                        >
                            {i18n('title_available')}
                        </Label>
                    </Flex>
                    <div role="group" aria-label={progressLabel}>
                        <SegmentedProgress
                            segments={segments}
                            total={progressTotalGroups}
                            ariaLabel={progressLabel}
                            hideLabels
                        />
                    </div>
                </Flex>
                <Flex justifyContent="space-between" alignItems="center" gap={2} wrap="wrap">
                    <Flex alignItems="center" gap={4} wrap="wrap">
                        {erasures.map((erasureStats) => (
                            <Flex key={erasureStats.erasure} alignItems="center" gap={2}>
                                <span
                                    aria-hidden="true"
                                    className={b('legend-dot')}
                                    style={{backgroundColor: getErasureColor(erasureStats.erasure)}}
                                />
                                <Text>{erasureStats.erasure}</Text>
                                <Text color="secondary">
                                    {formatGroups(erasureStats.createdGroups)}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                    <Text color="secondary">{formatGroups(allocatedGroups)}</Text>
                </Flex>
            </Flex>
        </Card>
    );
}

interface StorageGroupStatsProps {
    groupStats: ClusterGroupsStats;
}

export function StorageGroupStats({groupStats}: StorageGroupStatsProps) {
    const stats = React.useMemo(() => prepareClusterGroupsStats(groupStats), [groupStats]);

    return (
        <React.Fragment>
            <Text as="div" variant="subheader-2">
                {i18n('title_storage-groups')}{' '}
                <Text color="secondary" variant="subheader-2">
                    {formatNumber(stats.allocatedGroups)}
                </Text>
            </Text>
            <Flex direction="column" gap={1}>
                {stats.disks.map((diskStats) => (
                    <DiskGroupStats key={diskStats.diskType} stats={diskStats} />
                ))}
            </Flex>
        </React.Fragment>
    );
}
