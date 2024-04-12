export const METRIC_STATUS = {
    Unspecified: 'Unspecified',
    Good: 'Good',
    Warning: 'Warning',
    Danger: 'Danger',
} as const;

export const MetricStatusToSeverity = {
    [METRIC_STATUS.Unspecified]: 0,
    [METRIC_STATUS.Good]: 1,
    [METRIC_STATUS.Warning]: 2,
    [METRIC_STATUS.Danger]: 3,
};
