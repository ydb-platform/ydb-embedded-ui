import {QueriesActivityAlert} from './QueriesActivityAlert';
import {QueriesActivityExpandable} from './QueriesActivityExpandable';
import {QueriesActivitySkeleton} from './QueriesActivitySkeleton';
import {useChartAvailability} from './useChartAvailability';
import {useQueriesActivityData} from './useQueriesActivityData';

import './QueriesActivityBar.scss';

interface QueriesActivityBarProps {
    tenantName: string;
}

export function QueriesActivityBar({tenantName}: QueriesActivityBarProps) {
    // Check chart availability without rendering hidden components
    const areChartsAvailable = useChartAvailability(tenantName);

    const {runningQueriesCount, uniqueApplications, uniqueUsers, qps, latency} =
        useQueriesActivityData(tenantName);

    // Show skeleton while determining chart availability
    if (areChartsAvailable === null) {
        return <QueriesActivitySkeleton />;
    }

    // Render compact alert-style mode when charts are not available
    if (areChartsAvailable === false) {
        return (
            <QueriesActivityAlert
                runningQueriesCount={runningQueriesCount}
                uniqueApplications={uniqueApplications}
                uniqueUsers={uniqueUsers}
            />
        );
    }

    // Render expandable mode when charts are available
    return (
        <QueriesActivityExpandable
            tenantName={tenantName}
            runningQueriesCount={runningQueriesCount}
            uniqueApplications={uniqueApplications}
            uniqueUsers={uniqueUsers}
            qps={qps}
            latency={latency}
        />
    );
}
