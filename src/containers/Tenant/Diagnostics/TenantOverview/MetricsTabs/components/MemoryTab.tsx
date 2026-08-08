import {Link} from 'react-router-dom';

import {EFlag} from '../../../../../../types/api/enums';
import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import i18n from '../../i18n';
import type {TenantOverviewMetric} from '../../metricOverview';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');
const helpTextKeys: Partial<Record<EFlag, Parameters<typeof i18n>[0]>> = {
    [EFlag.Grey]: 'context_metric-status-unavailable',
    [EFlag.Green]: 'context_memory-status-normal',
    [EFlag.Yellow]: 'context_memory-status-warning',
    [EFlag.Red]: 'context_memory-status-critical',
};

interface MemoryTabProps {
    to: string;
    active: boolean;
    memory: TenantOverviewMetric;
}

export function MemoryTab({to, active, memory}: MemoryTabProps) {
    const helpTextKey = helpTextKeys[memory.status];

    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                <MetricTabCard
                    title={i18n('title_memory')}
                    status={memory.status}
                    value={memory.percentText ?? i18n('value_unavailable-percent')}
                    active={active}
                    description={i18n('context_memory-tab-description')}
                    helpText={helpTextKey ? i18n(helpTextKey) : undefined}
                />
            </Link>
        </div>
    );
}
