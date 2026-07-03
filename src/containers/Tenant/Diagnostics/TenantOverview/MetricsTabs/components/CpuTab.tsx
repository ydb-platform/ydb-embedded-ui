import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import i18n from '../../i18n';
import type {MetricTabPresentation} from '../../metricPresentation';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface CpuTabProps {
    to: string;
    active: boolean;
    cpu?: MetricTabPresentation;
}

export function CpuTab({to, active, cpu}: CpuTabProps) {
    // getTenantOverviewMetrics omits CPU only for Serverless; dedicated empty data
    // is passed as an N/A metric presentation.
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {cpu ? (
                    <MetricTabCard
                        title={i18n('title_cpu')}
                        status={cpu.status}
                        value={cpu.percentText}
                        active={active}
                        description={i18n('context_cpu-tab-description')}
                    />
                ) : (
                    <ServerlessTabCard
                        title={i18n('title_cpu-load')}
                        active={active}
                        description={i18n('context_serverless-autoscaled')}
                        helpText={i18n('context_cpu-description')}
                    />
                )}
            </Link>
        </div>
    );
}
