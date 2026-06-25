import {EFlag} from '../../../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../../utils/constants';
import {formatPercent} from '../../../../../utils/dataFormatters/dataFormatters';
import {calculateProgressStatus} from '../../../../../utils/progress';
import type {ProgressStatus} from '../../../../../utils/progress';

const ProgressStatusToEFlag: Record<ProgressStatus, EFlag> = {
    good: EFlag.Green,
    warning: EFlag.Yellow,
    danger: EFlag.Red,
};

interface MetricTabPresentationParams {
    usagePercent: number;
    capDangerAtWarning?: boolean;
}

interface UsageMetricTabPresentationParams {
    value: number;
    limit: number;
    capDangerAtWarning?: boolean;
}

export interface MetricTabPresentation {
    percentText: string;
    status: EFlag;
}

function normalizeStatus(status: EFlag, capDangerAtWarning?: boolean) {
    if (capDangerAtWarning && status === EFlag.Red) {
        return EFlag.Yellow;
    }

    return status;
}

function calculateUsagePercent(value: number, limit: number) {
    if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) {
        return NaN;
    }

    return (value / limit) * 100;
}

function getMetricTabPercentPrecision(usagePercent: number) {
    return usagePercent > 0 && usagePercent < 1 ? 1 : 0;
}

export function getMetricTabPresentation({
    usagePercent,
    capDangerAtWarning,
}: MetricTabPresentationParams): MetricTabPresentation {
    if (!Number.isFinite(usagePercent)) {
        return {
            percentText: EMPTY_DATA_PLACEHOLDER,
            status: EFlag.Grey,
        };
    }

    const progressStatus = calculateProgressStatus({
        fillWidth: usagePercent,
        colorizeProgress: true,
    });

    return {
        percentText: formatPercent(usagePercent / 100, getMetricTabPercentPrecision(usagePercent)),
        status: normalizeStatus(ProgressStatusToEFlag[progressStatus], capDangerAtWarning),
    };
}

export function getUsageMetricTabPresentation({
    value,
    limit,
    capDangerAtWarning,
}: UsageMetricTabPresentationParams): MetricTabPresentation {
    return getMetricTabPresentation({
        usagePercent: calculateUsagePercent(value, limit),
        capDangerAtWarning,
    });
}
