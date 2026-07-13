import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import i18n from '../../i18n';
import type {TenantOverviewMetric} from '../../metricOverview';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface CpuTabProps {
    to: string;
    active: boolean;
    cpu?: TenantOverviewMetric;
    isServerless: boolean;
}

export function CpuTab({to, active, cpu, isServerless}: CpuTabProps) {
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
                    />
                )}
            </Link>
        </div>
    );
}
