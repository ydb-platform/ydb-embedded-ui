import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {MetricTabCard} from '../../TabCard/MetricTabCard';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import i18n from '../../i18n';
import type {MetricTabPresentation} from '../../metricPresentation';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface StorageTabProps {
    to: string;
    active: boolean;
    storage?: MetricTabPresentation;
}

export function StorageTab({to, active, storage}: StorageTabProps) {
    // getTenantOverviewMetrics omits storage only for Serverless; dedicated empty data
    // is passed as an N/A metric presentation.
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {storage ? (
                    <MetricTabCard
                        title={i18n('title_storage')}
                        status={storage.status}
                        value={storage.percentText}
                        active={active}
                        description={i18n('context_storage-tab-description')}
                    />
                ) : (
                    <ServerlessTabCard
                        title={i18n('title_storage')}
                        active={active}
                        description={i18n('context_storage-serverless-tab-description')}
                        helpText={i18n('context_storage-description')}
                    />
                )}
            </Link>
        </div>
    );
}
