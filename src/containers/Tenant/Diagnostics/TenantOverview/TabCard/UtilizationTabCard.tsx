import React from 'react';

import {getMetricTabPresentation} from '../MetricsTabs/metricTabPresentation';

import {MetricTabCard} from './MetricTabCard';

interface UtilizationTabCardProps {
    title: string;
    active?: boolean;
    description: string;
    fillPercent: number;
}

export function UtilizationTabCard({
    title,
    fillPercent,
    description,
    active,
}: UtilizationTabCardProps) {
    const {status, percentText} = React.useMemo(
        () => getMetricTabPresentation({usagePercent: fillPercent}),
        [fillPercent],
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
