const FALLBACK_VALUE = 0.000001;

export enum TrendDirection {
    Up = 'up',
    Down = 'down',
}

export interface MetricTrend {
    value: number;
    direction: TrendDirection;
}

export interface MetricCalculationResult {
    value: string;
    trend: MetricTrend;
}

/**
 * Calculate queries per second metrics from chart data
 */
export const calculateQueriesPerSecond = (data?: (number | null)[]): MetricCalculationResult => {
    const emptyFallback = {
        value: FALLBACK_VALUE.toFixed(0),
        trend: {value: FALLBACK_VALUE, direction: TrendDirection.Up},
    };

    if (!data) {
        return emptyFallback;
    }

    // Safe array access with length validation
    if (data.length === 0) {
        return emptyFallback;
    }

    const current = data[data.length - 1] ?? FALLBACK_VALUE;
    const previous = data.length >= 2 ? (data[data.length - 2] ?? FALLBACK_VALUE) : FALLBACK_VALUE;

    let trend: MetricTrend;
    if (previous > 0) {
        const change = current - previous;
        trend = {
            value: Math.abs(change),
            direction: change >= 0 ? TrendDirection.Up : TrendDirection.Down,
        };
    } else {
        trend = {value: FALLBACK_VALUE, direction: TrendDirection.Up};
    }

    return {value: current.toFixed(0), trend};
};

/**
 * Calculate latency metrics from chart data
 */
export const calculateLatency = (data?: (number | null)[]): MetricCalculationResult => {
    if (!data) {
        return {
            value: FALLBACK_VALUE.toFixed(1),
            trend: {value: FALLBACK_VALUE, direction: TrendDirection.Up},
        };
    }

    // Safe array access with length validation
    if (data.length === 0) {
        return {
            value: FALLBACK_VALUE.toFixed(1),
            trend: {value: FALLBACK_VALUE, direction: TrendDirection.Up},
        };
    }

    const current = data[data.length - 1] ?? FALLBACK_VALUE;
    const previous = data.length >= 2 ? (data[data.length - 2] ?? FALLBACK_VALUE) : FALLBACK_VALUE;

    let trend: MetricTrend;
    if (previous > 0) {
        const change = current - previous;
        trend = {
            value: Math.abs(change),
            direction: change >= 0 ? TrendDirection.Up : TrendDirection.Down,
        };
    } else {
        trend = {value: FALLBACK_VALUE, direction: TrendDirection.Up};
    }

    return {value: current.toFixed(1), trend};
};

/**
 * Format trend value for display
 */
export const formatTrendValue = (val: number): string => {
    if (val >= 1) {
        return `+${val.toFixed(0)}`;
    } else if (val > 0) {
        return `+${val.toFixed(1)}`;
    } else {
        return val.toFixed(1);
    }
};
