import React from 'react';

import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import {isClusterInfoV2} from '../../../types/api/cluster';
import type {TClusterInfo} from '../../../types/api/cluster';
import {formatNumber, formatPercent} from '../../../utils/dataFormatters/dataFormatters';
import {calculateProgressStatus} from '../../../utils/progress';
import {DiskGroupsErasureStats} from '../ClusterInfo/components/DiskGroupsStatsBars/DiskGroupsStatsBars';

import type {ClusterMetricsCommonProps} from './shared';

export function useDiagramValues({
    value,
    capacity,
    colorizeProgress = true,
    warningThreshold,
    dangerThreshold,
    inverseColorize = false,
    legendFormatter,
}: ClusterMetricsCommonProps & {
    legendFormatter: (params: {value: number; capacity: number}) => string;
}) {
    const parsedValue = parseFloat(String(value));
    const parsedCapacity = parseFloat(String(capacity));
    let fillWidth = (parsedValue / parsedCapacity) * 100 || 0;
    fillWidth = fillWidth > 100 ? 100 : fillWidth;
    const normalizedFillWidth = fillWidth < 1 ? 0.5 : fillWidth;
    const status = calculateProgressStatus({
        fillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress,
        inverseColorize,
    });

    const percents = formatPercent(fillWidth / 100);
    const legend = legendFormatter({
        value: parsedValue,
        capacity: parsedCapacity,
    });

    return {status, percents, legend, fill: normalizedFillWidth};
}

export function getDCInfo(cluster: TClusterInfo) {
    if (isClusterInfoV2(cluster) && cluster.MapDataCenters) {
        return Object.keys(cluster.MapDataCenters);
    }
    return cluster.DataCenters?.filter(Boolean);
}

const rolesToShow = ['storage', 'tenant'];

export function getNodesRolesInfo(cluster: TClusterInfo) {
    const nodesRoles: React.ReactNode[] = [];
    if (isClusterInfoV2(cluster) && cluster.MapNodeRoles) {
        for (const [role, count] of Object.entries(cluster.MapNodeRoles)) {
            if (rolesToShow.includes(role.toLowerCase())) {
                nodesRoles.push(
                    <React.Fragment key={role}>
                        {role}: {formatNumber(count)}
                    </React.Fragment>,
                );
            }
        }
    }
    return nodesRoles;
}

export function getStorageGroupStats(groupStats: ClusterGroupsStats) {
    const result: React.ReactNode[] = [];

    Object.entries(groupStats).forEach(([storageType, stats]) => {
        Object.values(stats).forEach((erasureStats) => {
            result.push(
                <DiskGroupsErasureStats
                    stats={erasureStats}
                    key={`${storageType}|${erasureStats.erasure}`}
                >
                    {storageType}: {formatNumber(erasureStats.createdGroups)} /{' '}
                    {formatNumber(erasureStats.totalGroups)}
                </DiskGroupsErasureStats>,
            );
        });
    });
    return result;
}

export const getTotalStorageGroupsUsed = (groupStats: ClusterGroupsStats) => {
    return Object.values(groupStats).reduce((acc, data) => {
        Object.values(data).forEach((erasureStats) => {
            acc += erasureStats.createdGroups;
        });

        return acc;
    }, 0);
};
