import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
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
                    title={i18n('metric-tab.memory-title')}
                    value={memory.totalUsed}
                    limit={memory.totalLimit}
                    active={active}
                    description={i18n('metric-tab.memory-description')}
                />
            </Link>
        </div>
    );
}
