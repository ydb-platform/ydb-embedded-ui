import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
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
    controlPlaneNodesCount?: number;
}

export function CpuTab({to, active, isServerless, cpu}: CpuTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {isServerless ? (
                    <ServerlessTabCard
                        title={i18n('metric-tab.cpu-serverless-title')}
                        active={active}
                        description={i18n('context_serverless-autoscaled')}
                        helpText={i18n('context_cpu-description')}
                    />
                ) : (
                    <UsageTabCard
                        title={i18n('metric-tab.cpu-title')}
                        value={cpu.totalUsed}
                        limit={cpu.totalLimit}
                        active={active}
                        description={i18n('metric-tab.cpu-description')}
                    />
                )}
            </Link>
        </div>
    );
}
