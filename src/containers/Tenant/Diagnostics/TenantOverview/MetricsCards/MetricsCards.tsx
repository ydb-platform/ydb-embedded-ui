import {Link, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import {
    METRIC_STATUS,
    MetricStatusToSeverity,
} from '../../../../../store/reducers/tenants/contants';
import type {MetricStatus} from '../../../../../store/reducers/tenants/types';
import type {
    TenantMetricStats,
    TenantPoolsStats,
    TenantStorageStats,
} from '../../../../../store/reducers/tenants/utils';
import {getMetricStatusFromUsage} from '../../../../../store/reducers/tenants/utils';
import {formatBytes} from '../../../../../utils/bytesParsers';
import {cn} from '../../../../../utils/cn';
import {SHOW_NETWORK_UTILIZATION} from '../../../../../utils/constants';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {useSetting, useTypedSelector} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import i18n from '../i18n';

import type {DiagnosticsCardMetric} from './MetricCard/MetricCard';
import {MetricCard} from './MetricCard/MetricCard';

import './MetricsCards.scss';

const b = cn('metrics-cards');

export interface TenantMetrics {
    memoryUsed?: number;
    memoryLimit?: number;
    cpuUsed?: number;
    cpuUsage?: number;
    storageUsed?: number;
    storageLimit?: number;
}

interface MetricsCardsProps {
    poolsCpuStats?: TenantPoolsStats[];
    memoryStats?: TenantMetricStats[];
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
    networkStats?: TenantMetricStats[];
}

export function MetricsCards({
    poolsCpuStats,
    memoryStats,
    blobStorageStats,
    tabletStorageStats,
    networkStats,
}: MetricsCardsProps) {
    const location = useLocation();

    const {metricsTab} = useTypedSelector((state) => state.tenant);

    const queryParams = parseQuery(location);

    // Allow tabs untoggle behaviour
    const getTabIfNotActive = (tab: TenantMetricsTab) => {
        if (tab === metricsTab) {
            return '';
        }

        return tab;
    };

    const tabLinks: Record<TenantMetricsTab, string> = {
        [TENANT_METRICS_TABS_IDS.cpu]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: getTabIfNotActive(TENANT_METRICS_TABS_IDS.cpu),
        }),
        [TENANT_METRICS_TABS_IDS.storage]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: getTabIfNotActive(TENANT_METRICS_TABS_IDS.storage),
        }),
        [TENANT_METRICS_TABS_IDS.memory]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: getTabIfNotActive(TENANT_METRICS_TABS_IDS.memory),
        }),
    };

    return (
        <div className={b()}>
            <Link to={tabLinks.cpu} className={b('tab')}>
                <CPUCard
                    poolsCpuStats={poolsCpuStats}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.cpu}
                />
            </Link>
            <Link to={tabLinks.storage} className={b('tab')}>
                <StorageCard
                    blobStorageStats={blobStorageStats}
                    tabletStorageStats={tabletStorageStats}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.storage}
                />
            </Link>
            <Link to={tabLinks.memory} className={b('tab')}>
                <MemoryCard
                    memoryStats={memoryStats}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.memory}
                />
            </Link>
            <NetworkCard networkStats={networkStats} />
        </div>
    );
}

interface CPUCardProps {
    poolsCpuStats?: TenantPoolsStats[];
    active?: boolean;
}

function CPUCard({poolsCpuStats = [], active}: CPUCardProps) {
    let status: MetricStatus = METRIC_STATUS.Unspecified;

    const metrics: DiagnosticsCardMetric[] = poolsCpuStats
        // Use only pools that directly indicate resources available to perform user queries
        .filter((pool) => !(pool.name === 'Batch' || pool.name === 'IO'))
        .map((pool) => {
            const {name, usage, limit, used} = pool;

            const poolStatus = getMetricStatusFromUsage(usage);
            if (MetricStatusToSeverity[poolStatus] > MetricStatusToSeverity[status]) {
                status = poolStatus;
            }

            return {
                title: name,
                value: used,
                capacity: limit,
            };
        });

    return (
        <MetricCard
            label={i18n('cards.cpu-label')}
            active={active}
            metrics={metrics}
            status={status}
        />
    );
}

interface StorageCardProps {
    active?: boolean;
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
}

function StorageCard({blobStorageStats = [], tabletStorageStats, active}: StorageCardProps) {
    let status: MetricStatus = METRIC_STATUS.Unspecified;

    // Display tablet storage stats if limits are set and blob storage stats otherwise
    const storageStats = tabletStorageStats || blobStorageStats;

    const metrics: DiagnosticsCardMetric[] = storageStats.map((metric) => {
        const {name, used, limit, usage} = metric;

        const metircStatus = getMetricStatusFromUsage(usage);
        if (MetricStatusToSeverity[metircStatus] > MetricStatusToSeverity[status]) {
            status = metircStatus;
        }

        return {
            title: name,
            value: used,
            capacity: limit,
            formatValues: formatStorageValues,
        };
    });

    return (
        <MetricCard
            label={i18n('cards.storage-label')}
            active={active}
            metrics={metrics}
            status={status}
        />
    );
}
interface MemoryCardProps {
    active?: boolean;
    memoryStats?: TenantMetricStats[];
}

function MemoryCard({active, memoryStats = []}: MemoryCardProps) {
    let status: MetricStatus = METRIC_STATUS.Unspecified;

    const metrics: DiagnosticsCardMetric[] = memoryStats.map((metric) => {
        const {name, used, limit, usage} = metric;

        const metircStatus = getMetricStatusFromUsage(usage);
        if (MetricStatusToSeverity[metircStatus] > MetricStatusToSeverity[status]) {
            status = metircStatus;
        }

        return {
            title: name,
            value: used,
            capacity: limit,
            formatValues: formatStorageValues,
        };
    });

    return (
        <MetricCard
            label={i18n('cards.memory-label')}
            active={active}
            metrics={metrics}
            status={status}
        />
    );
}
interface NetworkCardProps {
    networkStats?: TenantMetricStats[];
}

function NetworkCard({networkStats}: NetworkCardProps) {
    const [showNetworkUtilization] = useSetting<boolean>(SHOW_NETWORK_UTILIZATION);
    if (!showNetworkUtilization || !networkStats) {
        return null;
    }
    let status: MetricStatus = METRIC_STATUS.Unspecified;

    const metrics: DiagnosticsCardMetric[] = networkStats.map((metric) => {
        const {used, limit, usage} = metric;

        const metricStatus = getMetricStatusFromUsage(usage);
        if (MetricStatusToSeverity[metricStatus] > MetricStatusToSeverity[status]) {
            status = metricStatus;
        }

        return {
            title: formatBytes({value: limit, withSpeedLabel: true}),
            value: used,
            capacity: limit,
            percents: true,
            overflow: true,
        };
    });

    return (
        <MetricCard
            interactive={false}
            label={i18n('cards.network-label')}
            note={i18n('cards.network-note')}
            metrics={metrics}
            status={status}
        />
    );
}
