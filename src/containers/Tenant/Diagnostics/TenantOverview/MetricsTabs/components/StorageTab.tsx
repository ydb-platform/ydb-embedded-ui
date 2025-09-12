import {Link} from 'react-router-dom';

import {cn} from '../../../../../../utils/cn';
import {formatStorageLegend} from '../../../../../../utils/metrics/formatMetricLegend';
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

export function StorageTab({
    to,
    active,
    isServerless,
    storage,
    storageGroupsCount,
}: StorageTabProps) {
    const text =
        storageGroupsCount === undefined || isServerless
            ? i18n('cards.storage-label')
            : i18n('context_storage-groups', {count: storageGroupsCount});
    return (
        <div className={b('link-container', {active})}>
            <Link to={to} className={b('link')}>
                {isServerless ? (
                    <ServerlessTabCard
                        text={text}
                        active={active}
                        helpText={i18n('context_storage-description')}
                        subtitle={
                            storage.totalLimit
                                ? i18n('context_serverless-storage-subtitle', {
                                      groups: String(storageGroupsCount ?? 0),
                                      legend: formatStorageLegend({
                                          value: storage.totalUsed,
                                          capacity: storage.totalLimit,
                                      }),
                                  })
                                : undefined
                        }
                    />
                ) : (
                    <UsageTabCard
                        text={text}
                        value={storage.totalUsed}
                        limit={storage.totalLimit}
                        legendFormatter={formatStorageLegend}
                        active={active}
                        helpText={i18n('context_storage-description')}
                    />
                )}
            </Link>
        </div>
    );
}
