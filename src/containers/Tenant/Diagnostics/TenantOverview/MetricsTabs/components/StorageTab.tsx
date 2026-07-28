import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import i18n from '../../i18n';
import type {TenantOverviewMetric} from '../../metricOverview';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface StorageTabProps {
    to: string;
    active: boolean;
    isServerless: boolean;
    storage?: TenantOverviewMetric;
}

export function StorageTab({to, active, isServerless, storage}: StorageTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {isServerless || !storage ? (
                    <ServerlessTabCard
                        title={i18n('title_storage')}
                        active={active}
                        description={i18n('context_storage-serverless-tab-description')}
                        helpText={i18n('context_storage-description')}
                    />
                ) : (
                    <MetricTabCard
                        title={i18n('title_storage')}
                        status={storage.status}
                        value={storage.percentText ?? i18n('value_unavailable-percent')}
                        active={active}
                        description={i18n('context_storage-tab-description')}
                    />
                )}
            </Link>
        </div>
    );
}
