import {Flex} from '@gravity-ui/uikit';
import {Link, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {
    useCapabilitiesLoaded,
    useStorageGroupsHandlerAvailable,
} from '../../../../../store/reducers/capabilities/hooks';
import {storageApi} from '../../../../../store/reducers/storage/storage';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../../store/reducers/tenants/utils';
import {cn} from '../../../../../utils/cn';
import {SHOW_NETWORK_UTILIZATION} from '../../../../../utils/constants';
import {useAutoRefreshInterval, useSetting, useTypedSelector} from '../../../../../utils/hooks';
import {calculateMetricAggregates} from '../../../../../utils/metrics';
import {
    formatCoresLegend,
    formatSpeedLegend,
    formatStorageLegend,
} from '../../../../../utils/metrics/formatMetricLegend';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {TabCard} from '../TabCard/TabCard';
import i18n from '../i18n';

import './MetricsTabs.scss';

const b = cn('tenant-metrics-tabs');

interface MetricsTabsProps {
    tenantName: string;
    poolsCpuStats?: TenantPoolsStats[];
    memoryStats?: TenantMetricStats[];
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
    networkStats?: TenantMetricStats[];
}

export function MetricsTabs({
    tenantName,
    poolsCpuStats,
    memoryStats,
    blobStorageStats,
    tabletStorageStats,
    networkStats,
}: MetricsTabsProps) {
    const location = useLocation();
    const {metricsTab} = useTypedSelector((state) => state.tenant);
    const queryParams = parseQuery(location);

    // Fetch storage groups data to get correct count (only if groups handler available)
    const capabilitiesLoaded = useCapabilitiesLoaded();
    const groupsHandlerAvailable = useStorageGroupsHandlerAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {currentData: storageGroupsData} = storageApi.useGetStorageGroupsInfoQuery(
        {
            tenant: tenantName,
            shouldUseGroupsHandler: groupsHandlerAvailable,
            with: 'all',
            limit: 0,
            fieldsRequired: [],
        },
        {
            pollingInterval: autoRefreshInterval,
            skip: !capabilitiesLoaded || !groupsHandlerAvailable,
        },
    );

    const tabLinks: Record<TenantMetricsTab, string> = {
        [TENANT_METRICS_TABS_IDS.cpu]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.cpu,
        }),
        [TENANT_METRICS_TABS_IDS.storage]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.storage,
        }),
        [TENANT_METRICS_TABS_IDS.memory]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.memory,
        }),
        [TENANT_METRICS_TABS_IDS.network]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.network,
        }),
    };

    // Use only pools that directly indicate resources available to perform user queries
    const cpuPools = (poolsCpuStats || []).filter(
        (pool) => !(pool.name === 'Batch' || pool.name === 'IO'),
    );
    const cpuMetrics = calculateMetricAggregates(cpuPools);

    // Calculate storage metrics using utility
    const storageStats = tabletStorageStats || blobStorageStats || [];
    const storageMetrics = calculateMetricAggregates(storageStats);

    // Get correct storage groups count from API (only if groups handler available and data is loaded)
    const storageGroupCount =
        groupsHandlerAvailable && storageGroupsData ? storageGroupsData.total : undefined;

    // Calculate memory metrics using utility
    const memoryMetrics = calculateMetricAggregates(memoryStats);

    // Calculate network metrics using utility
    const [showNetworkUtilization] = useSetting<boolean>(SHOW_NETWORK_UTILIZATION);
    const networkMetrics = networkStats ? calculateMetricAggregates(networkStats) : null;

    return (
        <Flex className={b()} alignItems="center">
            <div
                className={b('link-container', {
                    active: metricsTab === TENANT_METRICS_TABS_IDS.cpu,
                })}
            >
                <Link to={tabLinks.cpu} className={b('link')}>
                    <TabCard
                        text={i18n('context_cpu-load')}
                        value={cpuMetrics.totalUsed}
                        limit={cpuMetrics.totalLimit}
                        legendFormatter={formatCoresLegend}
                        active={metricsTab === TENANT_METRICS_TABS_IDS.cpu}
                        helpText={i18n('context_cpu-description')}
                    />
                </Link>
            </div>
            <div
                className={b('link-container', {
                    active: metricsTab === TENANT_METRICS_TABS_IDS.storage,
                })}
            >
                <Link to={tabLinks.storage} className={b('link')}>
                    <TabCard
                        text={
                            storageGroupCount === undefined
                                ? i18n('cards.storage-label')
                                : i18n('context_storage-groups', {count: storageGroupCount})
                        }
                        value={storageMetrics.totalUsed}
                        limit={storageMetrics.totalLimit}
                        legendFormatter={formatStorageLegend}
                        active={metricsTab === TENANT_METRICS_TABS_IDS.storage}
                        helpText={i18n('context_storage-description')}
                    />
                </Link>
            </div>
            <div
                className={b('link-container', {
                    active: metricsTab === TENANT_METRICS_TABS_IDS.memory,
                })}
            >
                <Link to={tabLinks.memory} className={b('link')}>
                    <TabCard
                        text={i18n('context_memory-used')}
                        value={memoryMetrics.totalUsed}
                        limit={memoryMetrics.totalLimit}
                        legendFormatter={formatStorageLegend}
                        active={metricsTab === TENANT_METRICS_TABS_IDS.memory}
                        helpText={i18n('context_memory-description')}
                    />
                </Link>
            </div>
            {showNetworkUtilization && networkStats && networkMetrics && (
                <div
                    className={b('link-container', {
                        active: metricsTab === TENANT_METRICS_TABS_IDS.network,
                    })}
                >
                    <Link to={tabLinks.network} className={b('link')}>
                        <TabCard
                            text={i18n('context_network-usage')}
                            value={networkMetrics.totalUsed}
                            limit={networkMetrics.totalLimit}
                            legendFormatter={formatSpeedLegend}
                            active={metricsTab === TENANT_METRICS_TABS_IDS.network}
                            helpText={i18n('context_network-description')}
                        />
                    </Link>
                </div>
            )}
        </Flex>
    );
}
