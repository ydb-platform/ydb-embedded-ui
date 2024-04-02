import {Link, useLocation} from 'react-router-dom';

import {parseQuery} from '../../../../../routes';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import {
    calculateUsage,
    cpuUsageToStatus,
    formatTenantMetrics,
    memoryUsageToStatus,
    storageUsageToStatus,
} from '../../../../../store/reducers/tenants/utils';
import type {IResponseError} from '../../../../../types/api/error';
import type {SelfCheckResult, StatusFlag} from '../../../../../types/api/healthcheck';
import {cn} from '../../../../../utils/cn';
import {useTypedSelector} from '../../../../../utils/hooks';
import {TenantTabsGroups, getTenantPath} from '../../../TenantPages';
import {HealthcheckPreview} from '../Healthcheck/HealthcheckPreview';

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
    metrics?: TenantMetrics;
    issuesStatistics?: [StatusFlag, number][];
    selfCheckResult: SelfCheckResult;
    fetchHealthcheck: VoidFunction;
    healthcheckLoading?: boolean;
    healthCheckWasLoaded?: boolean;
    healthcheckError?: IResponseError;
}

export function MetricsCards({
    metrics,
    issuesStatistics,
    selfCheckResult,
    fetchHealthcheck,
    healthcheckLoading,
    healthCheckWasLoaded,
    healthcheckError,
}: MetricsCardsProps) {
    const location = useLocation();

    const {memoryUsed, memoryLimit, cpuUsage, storageUsed, storageLimit} = metrics || {};

    const {metricsTab} = useTypedSelector((state) => state.tenant);

    const storageUsage = calculateUsage(storageUsed, storageLimit);
    const memoryUsage = calculateUsage(memoryUsed, memoryLimit);

    const cpuStatus = cpuUsageToStatus(cpuUsage);
    const storageStatus = storageUsageToStatus(storageUsage);
    const memoryStatus = memoryUsageToStatus(memoryUsage);

    const {storage, memory} = formatTenantMetrics({
        storage: storageUsed,
        memory: memoryUsed,
    });

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
                <MetricCard
                    label="CPU"
                    progress={cpuUsage}
                    status={cpuStatus}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.cpu}
                />
            </Link>
            <Link to={tabLinks.storage} className={b('tab')}>
                <MetricCard
                    label="Storage"
                    progress={storageUsage}
                    status={storageStatus}
                    resourcesUsed={storage}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.storage}
                />
            </Link>
            <Link to={tabLinks.memory} className={b('tab')}>
                <MetricCard
                    label="Memory"
                    progress={memoryUsage}
                    status={memoryStatus}
                    resourcesUsed={memory}
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
