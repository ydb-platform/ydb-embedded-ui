import React from 'react';

import {Flex, Label, Text} from '@gravity-ui/uikit';

import {SegmentedProgress} from '../../../../../components/SegmentedProgress/SegmentedProgress';
import type {
    ClusterGroupsStats,
    DiskErasureGroupsStats,
} from '../../../../../store/reducers/cluster/types';
import {formatNumber} from '../../../../../utils/dataFormatters/dataFormatters';
import i18n from '../../../i18n';

interface GroupsStatsPopupContentProps {
    stats: DiskErasureGroupsStats;
    storageType: string;
}

function DiskGroupStats({stats, storageType}: GroupsStatsPopupContentProps) {
    const {erasure} = stats;

    return (
        <Flex direction="column" gap={2}>
            <Flex justifyContent="space-between" alignItems="center">
                <Text variant="subheader-1">{storageType}</Text>
                <Flex gap={4} wrap="nowrap" alignItems="center">
                    <Label theme="normal">
                        {i18n('title_available', {
                            count: formatNumber(stats.totalGroups - stats.createdGroups),
                        })}
                    </Label>
                    <Text color="secondary">
                        {i18n('title_allocated', {
                            used: formatNumber(stats.createdGroups),
                            total: formatNumber(stats.totalGroups),
                        })}
                    </Text>
                </Flex>
            </Flex>
            <SegmentedProgress
                value={stats.createdGroups}
                total={stats.totalGroups}
                labelStart={erasure}
            />
        </Flex>
    );
}

interface StorageGroupStatsProps {
    groupStats: ClusterGroupsStats;
}

export function StorageGroupStats({groupStats}: StorageGroupStatsProps) {
    const stats = React.useMemo(() => {
        const result: React.ReactNode[] = [];

        Object.entries(groupStats).forEach(([storageType, stats]) => {
            Object.values(stats).forEach((erasureStats) => {
                result.push(
                    <DiskGroupStats
                        key={`${storageType}|${erasureStats.erasure}`}
                        stats={erasureStats}
                        storageType={storageType}
                    />,
                );
            });
        });
        return result;
    }, [groupStats]);

    return (
        <Flex direction="column" gap={5}>
            {stats}
        </Flex>
    );
}
