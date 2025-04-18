import type {ClusterGroupsStats} from '../../../store/reducers/cluster/types';
import {formatPercent} from '../../../utils/dataFormatters/dataFormatters';
import {calculateProgressStatus} from '../../../utils/progress';

import type {ClusterMetricsBaseProps, ClusterMetricsCommonProps} from './shared';

export function calculateBaseDiagramValues({
    colorizeProgress = true,
    warningThreshold,
    dangerThreshold,
    inverseColorize = false,
    fillWidth,
}: ClusterMetricsBaseProps & {fillWidth: number}) {
    const normalizedFillWidth = fillWidth < 1 ? 0.5 : fillWidth;
    const status = calculateProgressStatus({
        fillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress,
        inverseColorize,
    });

    const percents = formatPercent(fillWidth / 100);

    return {status, percents, fill: normalizedFillWidth};
}

export function getDiagramValues({
    value,
    capacity,
    legendFormatter,
    ...rest
}: ClusterMetricsCommonProps & {
    legendFormatter: (params: {value: number; capacity: number}) => string;
}) {
    const parsedValue = parseFloat(String(value));
    const parsedCapacity = parseFloat(String(capacity));
    let fillWidth = (parsedValue / parsedCapacity) * 100 || 0;
    fillWidth = fillWidth > 100 ? 100 : fillWidth;

    const legend = legendFormatter({
        value: parsedValue,
        capacity: parsedCapacity,
    });
    return {
        ...calculateBaseDiagramValues({
            fillWidth,
            ...rest,
        }),
        legend,
    };
}

export const getTotalStorageGroupsUsed = (groupStats: ClusterGroupsStats) => {
    return Object.values(groupStats).reduce((acc, data) => {
        Object.values(data).forEach((erasureStats) => {
            acc += erasureStats.createdGroups;
        });

        return acc;
    }, 0);
};
