import {EFlag} from '../../../../../types/api/enums';
import {formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import {getMetricPercentPrecision} from '../../../../../utils/metrics';
import {calculateProgressStatus} from '../../../../../utils/progress';
import type {ProgressStatus} from '../../../../../utils/progress';
import i18n from '../i18n';

const ProgressStatusToEFlag: Record<ProgressStatus, EFlag> = {
    good: EFlag.Green,
    warning: EFlag.Yellow,
    danger: EFlag.Red,
};

interface MetricTabPresentationParams {
    usagePercent: number;
    dangerThreshold?: number;
}

interface UsageMetricTabPresentationParams {
    value: number;
    limit: number;
    dangerThreshold?: number;
}

export interface MetricTabPresentation {
    percentText: string;
    status: EFlag;
}

function calculateUsagePercent(value: number, limit: number) {
    if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) {
        return NaN;
    }

    return (value / limit) * 100;
}

export function getMetricTabPresentation({
    usagePercent,
    dangerThreshold,
}: MetricTabPresentationParams): MetricTabPresentation {
    if (!Number.isFinite(usagePercent)) {
        return {
            percentText: i18n('value_unavailable-percent'),
            status: EFlag.Grey,
        };
    }

    const progressStatus = calculateProgressStatus({
        fillWidth: usagePercent,
        colorizeProgress: true,
        dangerThreshold,
    });

    return {
        percentText: formatPercent(usagePercent / 100, getMetricPercentPrecision(usagePercent)),
        status: ProgressStatusToEFlag[progressStatus],
    };
}

export function getUsageMetricTabPresentation({
    value,
    limit,
    dangerThreshold,
}: UsageMetricTabPresentationParams): MetricTabPresentation {
    return getMetricTabPresentation({
        usagePercent: calculateUsagePercent(value, limit),
        dangerThreshold,
    });
}
