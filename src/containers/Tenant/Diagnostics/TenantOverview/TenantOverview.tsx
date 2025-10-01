import {Button, Flex, HelpMark, Icon, Label} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueriesActivityBar} from '../../../../components/QueriesActivityBar/QueriesActivityBar';
import {useDatabasesAvailable} from '../../../../store/reducers/capabilities/hooks';
import {overviewApi} from '../../../../store/reducers/overview/overview';
import {TENANT_METRICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {tenantApi} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import {getDatabaseLinks} from '../../../../utils/additionalProps';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {useAutoRefreshInterval, useTypedSelector} from '../../../../utils/hooks';
import {useClusterNameFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
import {mapDatabaseTypeToDBName} from '../../utils/schema';

import {HealthcheckPreview} from './Healthcheck/HealthcheckPreview';
import {MetricsTabs} from './MetricsTabs/MetricsTabs';
import {TenantCpu} from './TenantCpu/TenantCpu';
import {TenantMemory} from './TenantMemory/TenantMemory';
import {TenantNetwork} from './TenantNetwork/TenantNetwork';
import {TenantStorage} from './TenantStorage/TenantStorage';
import i18n from './i18n';
import {b} from './utils';

import './TenantOverview.scss';

interface TenantOverviewProps {
    database: string;
    databaseFullPath: string;
    additionalTenantProps?: AdditionalTenantsProps;
}

export function TenantOverview({
    database,
    databaseFullPath,
    additionalTenantProps,
}: TenantOverviewProps) {
    const {metricsTab} = useTypedSelector((state) => state.tenant);
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const clusterName = useClusterNameFromQuery();

    const isMetaDatabasesAvailable = useDatabasesAvailable();

    const {currentData: tenant, isFetching} = tenantApi.useGetTenantInfoQuery(
        {database, clusterName, isMetaDatabasesAvailable},
        {pollingInterval: autoRefreshInterval},
    );
    const tenantLoading = isFetching && tenant === undefined;
    const {Name, Type, Overall} = tenant || {};
    const isServerless = Type === 'Serverless';
    const activeMetricsTab =
        isServerless &&
        metricsTab !== TENANT_METRICS_TABS_IDS.cpu &&
        metricsTab !== TENANT_METRICS_TABS_IDS.storage
            ? TENANT_METRICS_TABS_IDS.cpu
            : metricsTab;

    const tenantType = mapDatabaseTypeToDBName(Type);
    // FIXME: remove after correct data is added to tenantInfo
    const {currentData: tenantSchemaData} = overviewApi.useGetOverviewQuery(
        {
            path: databaseFullPath,
            database,
            databaseFullPath,
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
        networkUtilization,
        networkThroughput,
    } = calculateTenantMetrics(tenantData);

    const storageMetrics = {
        blobStorageUsed: blobStorage,
        blobStorageLimit,
        tabletStorageUsed: tabletStorage,
        tabletStorageLimit,
    };

    const renderName = () => {
        return (
            <Flex alignItems="center" style={{overflow: 'hidden'}}>
                <EntityStatus
                    status={Overall}
                    name={Name || TENANT_DEFAULT_TITLE}
                    withLeftTrim
                    hasClipboardButton={Boolean(tenant)}
                    clipboardButtonAlwaysVisible
                />
                {isServerless ? (
                    <div className={b('serverless-tag')}>
                        <Label theme="clear" size="s" className={b('serverless-tag-label')}>
                            <Flex alignItems="center" gap="2">
                                {i18n('value_serverless')}
                                <HelpMark iconSize="s" className={b('serverless-tag-tooltip')}>
                                    {i18n('context_serverless-tooltip')}
                                </HelpMark>
                            </Flex>
                        </Label>
                    </div>
                ) : null}
            </Flex>
        );
    };

    const renderTabContent = () => {
        switch (activeMetricsTab) {
            case TENANT_METRICS_TABS_IDS.cpu: {
                return (
                    <TenantCpu
                        database={database}
                        databaseType={Type}
                        databaseFullPath={databaseFullPath}
                    />
                );
            }
            case TENANT_METRICS_TABS_IDS.storage: {
                return (
                    <TenantStorage
                        database={database}
                        metrics={storageMetrics}
                        databaseType={Type}
                    />
                );
            }
            case TENANT_METRICS_TABS_IDS.memory: {
                return (
                    <TenantMemory
                        database={database}
                        memoryUsed={tenantData.MemoryUsed}
                        memoryLimit={tenantData.MemoryLimit}
                        memoryStats={tenantData.MemoryStats}
                    />
                );
            }
            case TENANT_METRICS_TABS_IDS.network: {
                return <TenantNetwork database={database} />;
            }
            default: {
                return null;
            }
        }
    };

    const links = getDatabaseLinks(additionalTenantProps, Name, Type);

    return (
        <LoaderWrapper loading={tenantLoading}>
            <div className={b()}>
                <div className={b('info')}>
                    <div className={b('top-label')}>{tenantType}</div>
                    <Flex alignItems="center" gap="1" className={b('top')}>
                        {renderName()}
                        <Flex gap="2">
                            {links.map(({title, url, icon}) => (
                                <Button
                                    key={title}
                                    href={url}
                                    target="_blank"
                                    size="xs"
                                    title={title}
                                >
                                    <Icon data={icon} />
                                </Button>
                            ))}
                        </Flex>
                    </Flex>
                    <Flex direction="column" gap={4}>
                        {!isServerless && <HealthcheckPreview database={database} />}
                        <QueriesActivityBar database={database} />
                        <MetricsTabs
                            poolsCpuStats={poolsStats}
                            memoryStats={memoryStats}
                            blobStorageStats={blobStorageStats}
                            tabletStorageStats={tabletStorageStats}
                            networkUtilization={networkUtilization}
                            networkThroughput={networkThroughput}
                            storageGroupsCount={
                                tenantData.StorageGroups
                                    ? Number(tenantData.StorageGroups)
                                    : undefined
                            }
                            databaseType={Type}
                            activeTab={activeMetricsTab}
                        />
                    </Flex>
                </div>
                <div className={b('tab-content')}>{renderTabContent()}</div>
            </div>
        </LoaderWrapper>
    );
}
