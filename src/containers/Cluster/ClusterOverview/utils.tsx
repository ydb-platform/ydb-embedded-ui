import {formatPercent} from '../../../utils/dataFormatters/dataFormatters';
import {getMetricPercentPrecision} from '../../../utils/metrics';
import {calculateProgressStatus} from '../../../utils/progress';

import type {ClusterMetricsBaseProps, ClusterMetricsCommonProps} from './shared';

function parseDiagramValue(value: number | string) {
    if (typeof value === 'string' && value.trim() === '') {
        return NaN;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

function calculateFillWidth(value: number, capacity: number) {
    if (!Number.isFinite(value) || !Number.isFinite(capacity) || capacity <= 0) {
        return 0;
    }

    return (value / capacity) * 100;
}

export function calculateBaseDiagramValues({
    colorizeProgress = true,
    warningThreshold,
    dangerThreshold,
    fillWidth,
}: ClusterMetricsBaseProps & {fillWidth: number}) {
    const normalizedFillWidth = Math.max(fillWidth, 0.5);
    const status = calculateProgressStatus({
        fillWidth,
        warningThreshold,
        dangerThreshold,
        colorizeProgress,
    });

    const percents = formatPercent(fillWidth / 100, getMetricPercentPrecision(fillWidth));

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
    const parsedValue = parseDiagramValue(value);
    const parsedCapacity = parseDiagramValue(capacity);
    const fillWidth = calculateFillWidth(parsedValue, parsedCapacity);

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
