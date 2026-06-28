import React from 'react';

import {getMetricTabPresentation} from '../MetricsTabs/metricTabPresentation';

import {MetricTabCard} from './MetricTabCard';

interface UtilizationTabCardProps {
    title: string;
    active?: boolean;
    description: string;
    fillPercent: number;
    // Fill percentage above which the metric tab turns "danger" (red).
    // Defaults to the shared danger threshold. Set to Infinity to disable the
    // "danger" status entirely so the tab never turns red at any fill level
    // (it can still turn "warning"/yellow once the warning threshold is passed).
    dangerThreshold?: number;
}

export function UtilizationTabCard({
    title,
    fillPercent,
    description,
    active,
    dangerThreshold,
}: UtilizationTabCardProps) {
    const {status, percentText} = React.useMemo(
        () => getMetricTabPresentation({usagePercent: fillPercent, dangerThreshold}),
        [dangerThreshold, fillPercent],
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
