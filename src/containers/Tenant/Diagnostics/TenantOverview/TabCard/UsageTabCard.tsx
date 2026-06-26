import React from 'react';

import {getUsageMetricTabPresentation} from '../MetricsTabs/metricTabPresentation';

import {MetricTabCard} from './MetricTabCard';

interface UsageTabCardProps {
    title: string;
    active?: boolean;
    description: string;
    value: number;
    limit: number;
    capDangerAtWarning?: boolean;
}

export function UsageTabCard({
    title,
    value,
    limit,
    description,
    active,
    capDangerAtWarning,
}: UsageTabCardProps) {
    const {status, percentText} = React.useMemo(
        () => getUsageMetricTabPresentation({value, limit, capDangerAtWarning}),
        [capDangerAtWarning, limit, value],
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
