import {Flex, Loader} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {LogsButton} from '../../../../components/LogsButton/LogsButton';
import {MonitoringButton} from '../../../../components/MonitoringButton/MonitoringButton';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {TENANT_METRICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {tenantApi} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../../types/additionalProps';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useClusterNameFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
import {mapDatabaseTypeToDBName} from '../../utils/schema';

import {DefaultOverviewContent} from './DefaultOverviewContent/DefaultOverviewContent';
import {HealthcheckDetails} from './Healthcheck/HealthcheckDetails';
import {MetricsCards} from './MetricsCards/MetricsCards';
import {TenantCpu} from './TenantCpu/TenantCpu';
import {TenantMemory} from './TenantMemory/TenantMemory';
import {TenantStorage} from './TenantStorage/TenantStorage';
import {b} from './utils';

import './TenantOverview.scss';

interface TenantOverviewProps {
    tenantName: string;
    additionalTenantProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
}

export function TenantOverview({
    tenantName,
    additionalTenantProps,
    additionalNodesProps,
}: TenantOverviewProps) {
    const {metricsTab} = useTypedSelector((state) => state.tenant);
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const clusterName = useClusterNameFromQuery();

    const {currentData: tenant, isFetching} = tenantApi.useGetTenantInfoQuery(
        {path: tenantName, clusterName},
        {pollingInterval: autoRefreshInterval},
    );
    const tenantLoading = isFetching && tenant === undefined;
    const {Name, Type, Overall} = tenant || {};

    const tenantType = mapDatabaseTypeToDBName(Type);
    // FIXME: remove after correct data is added to tenantInfo
    const {currentData: tenantSchemaData} = overviewApi.useGetOverviewQuery(
        {
            path: tenantName,
            database: tenantName,
        },
        {
            pollingInterval: autoRefreshInterval,
        },
    );
    const {Tables, Topics} =
        tenantSchemaData?.PathDescription?.DomainDescription?.DiskSpaceUsage || {};

    const usedTabletStorage = [Tables?.TotalSize, Topics?.DataSize].reduce((sum, current) => {
        if (current) {
            return sum + Number(current);
        }

        return sum;
    }, 0);

    const tenantData = {
        ...tenant,
        Metrics: {
            ...tenant?.Metrics,
            // Replace incorrect tenant metric with correct value
            Storage: String(usedTabletStorage),
        },
    };
    // === === ===

    const {
        blobStorage,
        tabletStorage,
        blobStorageLimit,
        tabletStorageLimit,

        poolsStats,
        memoryStats,
        blobStorageStats,
        tabletStorageStats,
    } = calculateTenantMetrics(tenantData);

    const storageMetrics = {
        blobStorageUsed: blobStorage,
        blobStorageLimit,
        tabletStorageUsed: tabletStorage,
        tabletStorageLimit,
    };

    const renderName = () => {
        return (
            <div className={b('tenant-name-wrapper')}>
                <EntityStatus
                    status={Overall}
                    name={Name || TENANT_DEFAULT_TITLE}
                    withLeftTrim
                    hasClipboardButton={Boolean(tenant)}
                    clipboardButtonAlwaysVisible
                />
            </div>
        );
    };

    const renderTabContent = () => {
        switch (metricsTab) {
            case TENANT_METRICS_TABS_IDS.cpu: {
                return (
                    <TenantCpu
                        tenantName={tenantName}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
            case TENANT_METRICS_TABS_IDS.storage: {
                return <TenantStorage tenantName={tenantName} metrics={storageMetrics} />;
            }
            case TENANT_METRICS_TABS_IDS.memory: {
                return (
                    <TenantMemory
                        tenantName={tenantName}
                        memoryUsed={tenantData.MemoryUsed}
                        memoryLimit={tenantData.MemoryLimit}
                        memoryStats={tenantData.MemoryStats}
                    />
                );
            }
            case TENANT_METRICS_TABS_IDS.healthcheck: {
                return <HealthcheckDetails tenantName={tenantName} />;
            }
            default: {
                return <DefaultOverviewContent database={tenantName} />;
            }
        }
    };

    if (tenantLoading) {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    }

    const monitoringLink = additionalTenantProps?.getMonitoringLink?.(Name, Type);
    const logsLink = additionalTenantProps?.getLogsLink?.(Name);

    return (
        <div className={b()}>
            <div className={b('info')}>
                <div className={b('top-label')}>{tenantType}</div>
                <Flex alignItems="center" gap="1" className={b('top')}>
                    {renderName()}
                    <Flex gap="2">
                        {monitoringLink && <MonitoringButton href={monitoringLink} />}
                        {logsLink && <LogsButton href={logsLink} />}
                    </Flex>
                </Flex>
                <MetricsCards
                    poolsCpuStats={poolsStats}
                    memoryStats={memoryStats}
                    blobStorageStats={blobStorageStats}
                    tabletStorageStats={tabletStorageStats}
                    tenantName={tenantName}
                />
            </div>
            {renderTabContent()}
        </div>
    );
}
