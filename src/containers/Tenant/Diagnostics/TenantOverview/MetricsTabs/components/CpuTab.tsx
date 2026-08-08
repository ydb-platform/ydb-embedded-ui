import {Link} from 'react-router-dom';

import {EFlag} from '../../../../../../types/api/enums';
import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import i18n from '../../i18n';
import type {TenantOverviewMetric} from '../../metricOverview';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');
const helpTextKeys: Partial<Record<EFlag, Parameters<typeof i18n>[0]>> = {
    [EFlag.Grey]: 'context_metric-status-unavailable',
    [EFlag.Green]: 'context_cpu-status-normal',
    [EFlag.Yellow]: 'context_cpu-status-warning',
    [EFlag.Red]: 'context_cpu-status-critical',
};

interface CpuTabProps {
    to: string;
    active: boolean;
    cpu?: TenantOverviewMetric;
    isServerless: boolean;
}

export function CpuTab({to, active, cpu, isServerless}: CpuTabProps) {
    const helpTextKey = cpu ? helpTextKeys[cpu.status] : undefined;

    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {isServerless || !cpu ? (
                    <ServerlessTabCard
                        title={i18n('title_cpu-load')}
                        active={active}
                        description={i18n('context_serverless-autoscaled')}
                        helpText={i18n('context_cpu-description')}
                    />
                ) : (
                    <MetricTabCard
                        title={i18n('title_cpu')}
                        status={cpu.status}
                        value={cpu.percentText ?? i18n('value_unavailable-percent')}
                        active={active}
                        description={i18n('context_cpu-tab-description')}
                        helpText={helpTextKey ? i18n(helpTextKey) : undefined}
                    />
                )}
            </Link>
        </div>
    );
}
