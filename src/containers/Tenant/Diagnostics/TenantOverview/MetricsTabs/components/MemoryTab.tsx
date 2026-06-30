import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import i18n from '../../i18n';
import type {MetricTabPresentation} from '../../metricPresentation';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface MemoryTabProps {
    to: string;
    active: boolean;
    memory: MetricTabPresentation;
}

export function MemoryTab({to, active, memory}: MemoryTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                <MetricTabCard
                    title={i18n('title_memory')}
                    status={memory.status}
                    value={memory.percentText}
                    active={active}
                    description={i18n('context_memory-tab-description')}
                />
            </Link>
        </div>
    );
}
