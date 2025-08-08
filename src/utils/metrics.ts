import {METRIC_STATUS, MetricStatusToSeverity} from '../store/reducers/tenants/contants';
import type {MetricStatus} from '../store/reducers/tenants/types';
import {getMetricStatusFromUsage} from '../store/reducers/tenants/utils';

import {calculateProgressStatus} from './progress';
import type {ProgressStatus} from './progress';

export interface MetricWithUsage {
    usage?: number;
    used?: number;
    limit?: number;
}

export interface DiagnosticsCardMetric {
    title?: string;
    value?: number;
    capacity?: number;
    formatValues?: (value?: number, total?: number) => string;
    percents?: boolean;
    withOverflow?: boolean;
}

export interface MetricCardResult {
    metrics: DiagnosticsCardMetric[];
    status: MetricStatus;
}

export interface MetricStats {
    used?: number;
    limit?: number;
}

export interface MetricAggregates {
    totalUsed: number;
    totalLimit: number;
    usagePercent: number;
    status: ProgressStatus;
}

/**
 * Generic function to create DiagnosticsCardMetric array and determine status
 */
export const createDiagnosticsCardMetric = <T extends MetricWithUsage>(
    items: T[] = [],
    mapFunction: (item: T) => DiagnosticsCardMetric,
): MetricCardResult => {
    let status: MetricStatus = METRIC_STATUS.Unspecified;

    const metrics = items.map((item) => {
        const metric = mapFunction(item);

        // Update overall status based on individual metric usage
        if (item.usage !== undefined) {
            const itemStatus = getMetricStatusFromUsage(item.usage);
            if (MetricStatusToSeverity[itemStatus] > MetricStatusToSeverity[status]) {
                status = itemStatus;
            }
        }

        return metric;
    });

    return {
        metrics,
        status,
    };
};

/**
 * Get the highest severity status from an array of statuses
 */
export const getHighestSeverityStatus = (statuses: MetricStatus[]): MetricStatus => {
    return statuses.reduce((highest, current) => {
        return MetricStatusToSeverity[current] > MetricStatusToSeverity[highest]
            ? current
            : highest;
    }, METRIC_STATUS.Unspecified);
};

/**
 * Calculate metric aggregates (sum of used/limit values) and determine status
 * This replaces the repetitive calculation logic from MetricsTabs.tsx
 */
export const calculateMetricAggregates = <T extends MetricStats>(
    items: T[] = [],
): MetricAggregates => {
    // Sum up used and limit values with proper number formatting
    const totalUsed = Number(items.reduce((sum, item) => sum + (item.used || 0), 0).toFixed(2));
    const totalLimit = Number(items.reduce((sum, item) => sum + (item.limit || 0), 0).toFixed(2));

    // Calculate usage percentage
    const usagePercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;

    // Determine status based on usage percentage
    const status = calculateProgressStatus({
        fillWidth: usagePercent,
        colorizeProgress: true,
        // Using default thresholds from constants (85% warning, 95% danger)
    });

    return {
        totalUsed,
        totalLimit,
        usagePercent,
        status,
    };
};
