import cn from 'bem-cn-lite';
import qs from 'qs';

import {Link} from 'react-router-dom';

import type {TenantMetricsTab} from '../../../../../store/reducers/tenant/types';
import {TENANT_METRICS_TABS_IDS} from '../../../../../store/reducers/tenant/constants';
import {useTypedSelector} from '../../../../../utils/hooks';
import routes, {createHref} from '../../../../../routes';
import {TenantTabsGroups} from '../../../TenantPages';
import {
    calculateUsage,
    cpuUsageToStatus,
    storageUsageToStatus,
    memoryUsageToStatus,
    formatTenantMetrics,
} from '../../../../../store/reducers/tenants/utils';
import type {SelfCheckResult, StatusFlag} from '../../../../../types/api/healthcheck';
import type {IResponseError} from '../../../../../types/api/error';
import {HealthcheckPreview} from '../../Healthcheck/HealthcheckPreview';
import {MetricCard} from './MetricCard/MetricCard';

import './MetricsCards.scss';

const b = cn('metrics-cards');

export interface TenantMetrics {
    memoryUsed?: number;
    memoryLimit?: number;
    cpuUsed?: number;
    cpuLimit?: number;
    storageUsed?: number;
    storageLimit?: number;
}

interface MetricsCardsProps {
    metrics?: TenantMetrics;
    issuesStatistics?: [StatusFlag, number][];
    selfCheckResult: SelfCheckResult;
    fetchHealthcheck: VoidFunction;
    healthcheckLoading?: boolean;
    healthcheckError?: IResponseError;
}

export function MetricsCards({
    metrics,
    issuesStatistics,
    selfCheckResult,
    fetchHealthcheck,
    healthcheckLoading,
    healthcheckError,
}: MetricsCardsProps) {
    const {memoryUsed, memoryLimit, cpuUsed, cpuLimit, storageUsed, storageLimit} = metrics || {};

    const {metricsTab} = useTypedSelector((state) => state.tenant);

    const cpuUsage = calculateUsage(cpuUsed, cpuLimit);
    const storageUsage = calculateUsage(storageUsed, storageLimit);
    const memoryUsage = calculateUsage(memoryUsed, memoryLimit);

    const cpuStatus = cpuUsageToStatus(cpuUsage);
    const storageStatus = storageUsageToStatus(storageUsage);
    const memoryStatus = memoryUsageToStatus(memoryUsage);

    const {cpu, storage, memory} = formatTenantMetrics({
        cpu: cpuUsed,
        storage: storageUsed,
        memory: memoryUsed,
    });

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    const tabLinks: Record<TenantMetricsTab, string> = {
        [TENANT_METRICS_TABS_IDS.cpu]: createHref(routes.tenant, undefined, {
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.cpu,
        }),
        [TENANT_METRICS_TABS_IDS.storage]: createHref(routes.tenant, undefined, {
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.storage,
        }),
        [TENANT_METRICS_TABS_IDS.memory]: createHref(routes.tenant, undefined, {
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.memory,
        }),
        [TENANT_METRICS_TABS_IDS.healthcheck]: createHref(routes.tenant, undefined, {
            ...queryParams,
            [TenantTabsGroups.metricsTab]: TENANT_METRICS_TABS_IDS.healthcheck,
        }),
    };

    return (
        <div className={b()}>
            <Link to={tabLinks.cpu} className={b('tab')}>
                <MetricCard
                    label="CPU"
                    progress={cpuUsage}
                    status={cpuStatus}
                    resourcesUsed={cpu}
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
                    error={healthcheckError}
                    active={metricsTab === TENANT_METRICS_TABS_IDS.healthcheck}
                />
            </Link>
        </div>
    );
}
