import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {ServerlessTabCard} from '../../TabCard/ServerlessTabCard';
import {UsageTabCard} from '../../TabCard/UsageTabCard';
import i18n from '../../i18n';

import '../MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface StorageTabProps {
    to: string;
    active: boolean;
    isServerless: boolean;
    storage: {totalUsed: number; totalLimit: number};
    storageGroupsCount?: number;
}

export function StorageTab({to, active, isServerless, storage}: StorageTabProps) {
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {isServerless ? (
                    <ServerlessTabCard
                        title={i18n('metric-tab.storage-title')}
                        active={active}
                        description={i18n('metric-tab.storage-serverless-description')}
                        helpText={i18n('context_storage-description')}
                    />
                ) : (
                    <UsageTabCard
                        title={i18n('metric-tab.storage-title')}
                        value={storage.totalUsed}
                        limit={storage.totalLimit}
                        active={active}
                        description={i18n('metric-tab.storage-description')}
                        // Never show the "danger" (red) status for storage,
                        // regardless of usage. The metric tab stays "warning"
                        // (yellow) above the warning threshold and never turns
                        // red, even at high usage below 100% (e.g. 91-99%) or
                        // on overflow above 100%.
                        dangerThreshold={Infinity}
                    />
                )}
            </Link>
        </div>
    );
}
