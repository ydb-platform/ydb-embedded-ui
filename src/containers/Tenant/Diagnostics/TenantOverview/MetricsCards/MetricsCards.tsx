import cn from 'bem-cn-lite';

import {
    MetricsTypes,
    calculateUsage,
    metricsUsageToStatus,
    formatTenantMetrics,
} from '../../../../../store/reducers/tenants/utils';
import type {TTenant} from '../../../../../types/api/tenant';
import {Healthcheck} from '../../Healthcheck';
import {MetricCard} from './MetricCard/MetricCard';

import i18n from '../i18n';

import './MetricsCards.scss';

const b = cn('metrics-tabs');

export interface IMetrics {
    memoryUsed?: number;
    memoryLimit?: number;
    cpuUsed?: number;
    cpuLimit?: number;
    storageUsed?: number;
    storageLimit?: number;
}

interface DatabaseMetricsProps {
    tenantName: string;
    showMoreHandler?: VoidFunction;
    metrics?: IMetrics;
    tenant?: TTenant;
}

export function DatabaseMetrics({tenantName, metrics, showMoreHandler}: DatabaseMetricsProps) {
    const {memoryUsed, memoryLimit, cpuUsed, cpuLimit, storageUsed, storageLimit} = metrics || {};
    const renderContent = (progressText?: string, valueText?: string, isSelected?: boolean) => {
        return (
            <div className={b('content', isSelected ? 'selected' : '')}>
                {progressText ? (
                    <div className={b('progress')}>{progressText}</div>
                ) : (
                    i18n('no-data')
                )}
                <div className={b('resources')}>{valueText}</div>
            </div>
        );
    };

    const [cpuUsage, cpuUsageString] = calculateUsage(cpuUsed, cpuLimit);
    const [storageUsage, storageUsageString] = calculateUsage(storageUsed, storageLimit);
    const [memoryUsage, memoryUsageString] = calculateUsage(memoryUsed, memoryLimit);

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
            <MetricCard label="CPU" progress={cpuUsage} status={cpuStatus.toLowerCase()}>
                {renderContent(cpuUsageString, cpu)}
            </MetricCard>
            <MetricCard
                label="Storage"
                progress={storageUsage}
                status={storageStatus.toLowerCase()}
            >
                {renderContent(storageUsageString, storage)}
            </MetricCard>
            <MetricCard label="Memory" progress={memoryUsage} status={memoryStatus.toLowerCase()}>
                {renderContent(memoryUsageString, memory)}
            </MetricCard>
            <Healthcheck tenant={tenantName} preview={true} showMoreHandler={showMoreHandler} />
        </div>
    );
}
