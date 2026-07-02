import type {ProgressTheme} from '@gravity-ui/uikit';

import {EFlag} from '../../../../types/api/enums';
import {EMPTY_DATA_PLACEHOLDER} from '../../../../utils/constants';
import {formatPercent} from '../../../../utils/dataFormatters/dataFormatters';
import {getMetricPercentPrecision} from '../../../../utils/metrics';
import {calculateProgressStatus} from '../../../../utils/progress';
import type {ProgressStatus} from '../../../../utils/progress';

import i18n from './i18n';

const ProgressStatusToEFlag: Record<ProgressStatus, EFlag> = {
    good: EFlag.Green,
    warning: EFlag.Yellow,
    danger: EFlag.Red,
};

const ProgressStatusToTheme: Record<ProgressStatus, ProgressTheme> = {
    good: 'success',
    warning: 'warning',
    danger: 'danger',
};

interface MetricPresentationParams {
    dangerThreshold?: number;
    usagePercent: number;
}

export interface MetricTabPresentation {
    percentText: string;
    status: EFlag;
}

export interface MetricPageSummaryPresentation {
    percentText: string;
    progressTheme?: ProgressTheme;
    progressValue: number;
    valueText?: string;
}

export function calculateUsagePercent(value: number, limit: number) {
    if (!Number.isFinite(value) || !Number.isFinite(limit) || limit <= 0) {
        return NaN;
    }

    return (value / limit) * 100;
}

function getPercentText(usagePercent: number) {
    return formatPercent(usagePercent / 100, getMetricPercentPrecision(usagePercent));
}

function getProgressValue(usagePercent: number) {
    const clampedValue = Math.min(Math.max(usagePercent, 0), 100);

    return Number(clampedValue.toFixed(getMetricPercentPrecision(clampedValue)));
}

export function getMetricTabPresentation({
    dangerThreshold,
    usagePercent,
}: MetricPresentationParams): MetricTabPresentation {
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
        percentText: getPercentText(usagePercent),
        status: ProgressStatusToEFlag[progressStatus],
    };
}

export function getMetricPageSummaryPresentation({
    dangerThreshold,
    usagePercent,
    valueText,
}: MetricPresentationParams & {
    valueText?: string;
}): MetricPageSummaryPresentation {
    if (!Number.isFinite(usagePercent)) {
        return {
            percentText: EMPTY_DATA_PLACEHOLDER,
            progressValue: 0,
            valueText,
        };
    }

    const progressStatus = calculateProgressStatus({
        fillWidth: usagePercent,
        colorizeProgress: true,
        dangerThreshold,
    });

    return {
        percentText: getPercentText(usagePercent),
        progressTheme: ProgressStatusToTheme[progressStatus],
        progressValue: getProgressValue(usagePercent),
        valueText,
    };
}
