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
import {
    TENANT_CPU_DANGER_TRESHOLD,
    TENANT_CPU_WARNING_TRESHOLD,
    TENANT_MEMORY_DANGER_TRESHOLD,
    TENANT_MEMORY_WARNING_TRESHOLD,
    TENANT_STORAGE_DANGER_TRESHOLD,
    TENANT_STORAGE_WARNING_TRESHOLD,
    cpuUsageToStatus,
    memoryUsageToStatus,
    storageUsageToStatus,
} from '../../../../../store/reducers/tenants/utils';
import type {IResponseError} from '../../../../../types/api/error';
import type {SelfCheckResult, StatusFlag} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';
import {formatStorageValues} from '../../../../../utils/dataFormatters/dataFormatters';
import {useTypedSelector} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {HealthcheckPreview} from '../Healthcheck/HealthcheckPreview';
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

    issuesStatistics?: [StatusFlag, number][];
    selfCheckResult: SelfCheckResult;
    fetchHealthcheck: VoidFunction;
    healthcheckLoading?: boolean;
    healthCheckWasLoaded?: boolean;
    healthcheckError?: IResponseError;
}

export function MetricsCards({
    poolsCpuStats,
    memoryStats,
    blobStorageStats,
    tabletStorageStats,
    issuesStatistics,
    selfCheckResult,
    fetchHealthcheck,
    healthcheckLoading,
    healthCheckWasLoaded,
    healthcheckError,
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
        [TENANT_METRICS_TABS_IDS.healthcheck]: getTenantPath({
            ...queryParams,
            [TenantTabsGroups.metricsTab]: getTabIfNotActive(TENANT_METRICS_TABS_IDS.healthcheck),
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
            <Link to={tabLinks.healthcheck} className={b('tab')}>
                <HealthcheckPreview
                    selfCheckResult={selfCheckResult}
                    issuesStatistics={issuesStatistics}
                    onUpdate={fetchHealthcheck}
                    loading={healthcheckLoading}
                    wasLoaded={healthCheckWasLoaded}
                    error={healthcheckError}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.healthcheck}
                />
            </Link>
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

            const poolStatus = cpuUsageToStatus(usage);
            if (MetricStatusToSeverity[poolStatus] > MetricStatusToSeverity[status]) {
                status = poolStatus;
            }

            return {
                title: name,
                value: used,
                capacity: limit,
                warningThreshold: TENANT_CPU_WARNING_TRESHOLD,
                dangerThreshold: TENANT_CPU_DANGER_TRESHOLD,
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

        const metircStatus = storageUsageToStatus(usage);
        if (MetricStatusToSeverity[metircStatus] > MetricStatusToSeverity[status]) {
            status = metircStatus;
        }

        return {
            title: name,
            value: used,
            capacity: limit,
            warningThreshold: TENANT_STORAGE_WARNING_TRESHOLD,
            dangerThreshold: TENANT_STORAGE_DANGER_TRESHOLD,
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

        const metircStatus = memoryUsageToStatus(usage);
        if (MetricStatusToSeverity[metircStatus] > MetricStatusToSeverity[status]) {
            status = metircStatus;
        }

        return {
            title: name,
            value: used,
            capacity: limit,
            warningThreshold: TENANT_MEMORY_WARNING_TRESHOLD,
            dangerThreshold: TENANT_MEMORY_DANGER_TRESHOLD,
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
