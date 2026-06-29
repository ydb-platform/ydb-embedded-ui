import React from 'react';

import {getUsageMetricTabPresentation} from '../MetricsTabs/metricTabPresentation';

import {MetricTabCard} from './MetricTabCard';

interface UsageTabCardProps {
    title: string;
    active?: boolean;
    description: string;
    value: number;
    limit: number;
    // Fill percentage above which the metric tab turns "danger" (red).
    // Defaults to the shared danger threshold. Set to Infinity to disable the
    // "danger" status entirely so the tab never turns red at any fill level
    // (it can still turn "warning"/yellow once the warning threshold is passed).
    dangerThreshold?: number;
}

export function UsageTabCard({
    title,
    value,
    limit,
    description,
    active,
    dangerThreshold,
}: UsageTabCardProps) {
    const {status, percentText} = React.useMemo(
        () => getUsageMetricTabPresentation({value, limit, dangerThreshold}),
        [dangerThreshold, limit, value],
    );

    return (
        <MetricTabCard
            title={title}
            status={status}
            value={percentText}
            description={description}
            active={active}
        />
    );
}
