import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {formatStorageLegend} from '../../../../../../utils/metrics/formatMetricLegend';
import {UsageTabCard} from '../../TabCard/UsageTabCard';
import i18n from '../../i18n';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface MemoryTabProps {
    to: string;
    active: boolean;
    memory: {totalUsed: number; totalLimit: number};
}

export function MemoryTab({to, active, memory}: MemoryTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                <UsageTabCard
                    text={i18n('context_memory-used')}
                    value={memory.totalUsed}
                    limit={memory.totalLimit}
                    legendFormatter={formatStorageLegend}
                    active={active}
                    helpText={i18n('context_memory-description')}
                />
            </Link>
        </div>
    );
}
