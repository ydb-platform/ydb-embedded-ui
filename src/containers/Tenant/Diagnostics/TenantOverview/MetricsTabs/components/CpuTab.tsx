import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {formatCoresLegend} from '../../../../../../utils/metrics/formatMetricLegend';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import {UsageTabCard} from '../../TabCard/UsageTabCard';
import i18n from '../../i18n';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface CpuTabProps {
    to: string;
    active: boolean;
    isServerless: boolean;
    cpu: {totalUsed: number; totalLimit: number};
}

export function CpuTab({to, active, isServerless, cpu}: CpuTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {isServerless ? (
                    <ServerlessTabCard
                        text={i18n('context_cpu-load')}
                        active={active}
                        helpText={i18n('context_cpu-description')}
                        subtitle={i18n('context_serverless-autoscaled')}
                    />
                ) : (
                    <UsageTabCard
                        text={i18n('context_cpu-load')}
                        value={cpu.totalUsed}
                        limit={cpu.totalLimit}
                        legendFormatter={formatCoresLegend}
                        active={active}
                        helpText={i18n('context_cpu-description')}
                    />
                )}
            </Link>
        </div>
    );
}
