import {Link} from 'react-router-dom';

import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import type {ETenantType} from '../../../../../types/api/tenant';
import {cn} from '../../../../../utils/cn';
import {
    formatCoresLegend,
    formatStorageLegend,
} from '../../../../../utils/metrics/formatMetricLegend';
import {TabCard} from '../TabCard/TabCard';
import i18n from '../i18n';

const b = cn('tenant-metrics-tabs');

interface CommonMetricsTabsProps {
    activeTab: TenantMetricsTab;
    tabLinks: Record<TenantMetricsTab, string>;
    cpu: {totalUsed: number; totalLimit: number};
    storage: {totalUsed: number; totalLimit: number};
    storageGroupsCount?: number;
    databaseType?: ETenantType;
}

export function CommonMetricsTabs({
    activeTab,
    tabLinks,
    cpu,
    storage,
    storageGroupsCount,
    databaseType,
}: CommonMetricsTabsProps) {
    const isServerless = databaseType === 'Serverless';

    return (
        <>
            <div
                className={b('link-container', {
                    active: activeTab === TENANT_METRICS_TABS_IDS.cpu,
                })}
            >
                <Link to={tabLinks.cpu} className={b('link')}>
                    <TabCard
                        text={i18n('context_cpu-load')}
                        value={cpu.totalUsed}
                        limit={cpu.totalLimit}
                        legendFormatter={formatCoresLegend}
                        active={activeTab === TENANT_METRICS_TABS_IDS.cpu}
                        helpText={i18n('context_cpu-description')}
                        databaseType={databaseType}
                        subtitle={isServerless ? i18n('context_serverless-autoscaled') : undefined}
                    />
                </Link>
            </div>
            <div
                className={b('link-container', {
                    active: activeTab === TENANT_METRICS_TABS_IDS.storage,
                })}
            >
                <Link to={tabLinks.storage} className={b('link')}>
                    <TabCard
                        text={
                            storageGroupsCount === undefined || isServerless
                                ? i18n('cards.storage-label')
                                : i18n('context_storage-groups', {count: storageGroupsCount})
                        }
                        value={storage.totalUsed}
                        limit={storage.totalLimit}
                        legendFormatter={formatStorageLegend}
                        active={activeTab === TENANT_METRICS_TABS_IDS.storage}
                        helpText={i18n('context_storage-description')}
                        databaseType={databaseType}
                        subtitle={
                            isServerless && storage.totalLimit
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
                </Link>
            </div>
        </>
    );
}
