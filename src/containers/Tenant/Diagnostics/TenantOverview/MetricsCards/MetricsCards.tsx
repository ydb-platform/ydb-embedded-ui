import cn from 'bem-cn-lite';

import {
    calculateUsage,
    metricsUsageToStatus,
    formatTenantMetrics,
} from '../../../../../store/reducers/tenants/utils';
import {MetricsTypes} from '../../../../../store/reducers/tenants/types';
import {Healthcheck} from '../../Healthcheck';

import {MetricCard} from './MetricCard/MetricCard';
import './MetricsCards.scss';

const b = cn('metrics-cards');

export interface ITenantMetrics {
    memoryUsed?: number;
    memoryLimit?: number;
    cpuUsed?: number;
    cpuLimit?: number;
    storageUsed?: number;
    storageLimit?: number;
}

interface MetricsCardsProps {
    tenantName: string;
    showMoreHandler?: VoidFunction;
    metrics?: ITenantMetrics;
}

export function MetricsCards({tenantName, metrics, showMoreHandler}: MetricsCardsProps) {
    const {memoryUsed, memoryLimit, cpuUsed, cpuLimit, storageUsed, storageLimit} = metrics || {};

    const cpuUsage = calculateUsage(cpuUsed, cpuLimit);
    const storageUsage = calculateUsage(storageUsed, storageLimit);
    const memoryUsage = calculateUsage(memoryUsed, memoryLimit);

    const cpuStatus = metricsUsageToStatus(MetricsTypes.CPU, cpuUsage);
    const storageStatus = metricsUsageToStatus(MetricsTypes.Storage, storageUsage);
    const memoryStatus = metricsUsageToStatus(MetricsTypes.Memory, memoryUsage);

    const {cpu, storage, memory} = formatTenantMetrics({
        cpu: cpuUsed,
        storage: storageUsed,
        memory: memoryUsed,
    });

    return (
        <div className={b()}>
            <MetricCard label="CPU" progress={cpuUsage} status={cpuStatus} resourcesUsed={cpu} />
            <MetricCard
                label="Storage"
                progress={storageUsage}
                status={storageStatus}
                resourcesUsed={storage}
            />
            <MetricCard
                label="Memory"
                progress={memoryUsage}
                status={memoryStatus}
                resourcesUsed={memory}
            />
            <Healthcheck tenant={tenantName} preview={true} showMoreHandler={showMoreHandler} />
        </div>
    );
}
