import {formatPercent} from '../../../utils/dataFormatters/dataFormatters';
import {calculateProgressStatus} from '../../../utils/progress';

import type {ClusterMetricsBaseProps, ClusterMetricsCommonProps} from './shared';

export function calculateBaseDiagramValues({
    colorizeProgress = true,
    warningThreshold,
    dangerThreshold,
    inverseColorize = false,
    fillWidth,
    percentPrecision,
}: ClusterMetricsBaseProps & {fillWidth: number}) {
    const normalizedFillWidth = Math.max(fillWidth, 0.5);
    const status = calculateProgressStatus({
        fillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress,
        inverseColorize,
    });

    const percents = formatPercent(fillWidth / 100, percentPrecision);

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
    const fillWidth = (parsedValue / parsedCapacity) * 100 || 0;

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
