import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import i18n from '../../i18n';
import type {TenantOverviewMetric} from '../../metricOverview';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface NetworkTabProps {
    to: string;
    active: boolean;
    network: TenantOverviewMetric;
}

export function NetworkTab({to, active, network}: NetworkTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                <MetricTabCard
                    title={i18n('title_network')}
                    status={network.status}
                    value={network.percentText ?? i18n('value_unavailable-percent')}
                    active={active}
                    description={i18n('context_network-tab-description')}
                />
            </Link>
        </div>
    );
}
