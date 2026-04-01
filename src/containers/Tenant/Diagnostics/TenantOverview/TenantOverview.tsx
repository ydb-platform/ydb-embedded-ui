import React from 'react';

import {ChartAreaStacked} from '@gravity-ui/icons';
import {Button, Flex, Icon} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueriesActivityBar} from '../../../../components/QueriesActivityBar/QueriesActivityBar';
import {ServerlessDBLabel} from '../../../../components/ServerlessDBLabel/ServerlessDBLabel';
import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_METRICS_TABS_IDS,
    TENANT_PAGES_IDS,
} from '../../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, tenantApi} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import {getInfoTabLinks} from '../../../../utils/additionalProps';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useClusterNameFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
import {useDatabasesV2} from '../../../../utils/hooks/useDatabasesV2';
import {canShowTenantMonitoringTab} from '../../../../utils/monitoringVisibility';
import {useTenantPage} from '../../TenantNavigation/useTenantNavigation';
import {mapDatabaseTypeToDBName} from '../../utils/schema';
import {useNavigationV2Enabled} from '../../utils/useNavigationV2Enabled';

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
    const dispatch = useTypedDispatch();
    const isV2NavigationEnabled = useNavigationV2Enabled();

    const {handleTenantPageChange} = useTenantPage();

    const isMetaDatabasesAvailable = useDatabasesV2();

    const {currentData: tenant, isFetching} = tenantApi.useGetTenantInfoQuery(
        {database, clusterName, isMetaDatabasesAvailable},
        {pollingInterval: autoRefreshInterval},
    );
    const tenantLoading = isFetching && tenant === undefined;
    const {Name, Type, Overall, ControlPlane, CoresTotal} = tenant || {};
    const isServerless = Type === 'Serverless';
    const activeMetricsTab =
        isServerless &&
        metricsTab !== TENANT_METRICS_TABS_IDS.cpu &&
        metricsTab !== TENANT_METRICS_TABS_IDS.storage
            ? TENANT_METRICS_TABS_IDS.cpu
            : metricsTab;

    const controlPlaneNodesCount = ControlPlane?.scale_policy?.fixed_scale?.size;

    const tenantType = mapDatabaseTypeToDBName(Type);

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
    } = calculateTenantMetrics(tenant);

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
                {isServerless ? <ServerlessDBLabel className={b('serverless-tag')} /> : null}
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
                        memoryUsed={tenant?.MemoryUsed}
                        memoryLimit={tenant?.MemoryLimit}
                        memoryStats={tenant?.MemoryStats}
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

    const links = getInfoTabLinks(additionalTenantProps, Name, Type);
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const monitoringTabAvailable = canShowTenantMonitoringTab(
        tenant?.ControlPlane,
        clusterMonitoring,
    );

    const handleOpenMonitoring = () => {
        handleTenantPageChange(TENANT_PAGES_IDS.diagnostics);
        dispatch(setDiagnosticsTab(TENANT_DIAGNOSTICS_TABS_IDS.monitoring));
    };

    const renderOverviewHead = () => {
        if (isV2NavigationEnabled) {
            return null;
        }
        return (
            <React.Fragment>
                <Flex alignItems="center" gap="2" className={b('top-label')}>
                    {tenantType}
                    {monitoringTabAvailable && (
                        <Button view="normal" onClick={handleOpenMonitoring}>
                            <Icon data={ChartAreaStacked} size={16} />
                            {i18n('action_open-monitoring')}
                        </Button>
                    )}
                </Flex>
                <Flex alignItems="center" gap="1" className={b('top')}>
                    {renderName()}
                    {links.length > 0 && (
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
                    )}
                </Flex>
            </React.Fragment>
        );
    };

    return (
        <LoaderWrapper loading={tenantLoading}>
            <div className={b()}>
                <div className={b('info')}>
                    {renderOverviewHead()}
                    <Flex direction="column" gap={4}>
                        {!isServerless && !isV2NavigationEnabled && (
                            <HealthcheckPreview database={database} />
                        )}
                        <QueriesActivityBar database={database} />
                        <MetricsTabs
                            poolsCpuStats={poolsStats}
                            memoryStats={memoryStats}
                            blobStorageStats={blobStorageStats}
                            tabletStorageStats={tabletStorageStats}
                            networkUtilization={networkUtilization}
                            networkThroughput={networkThroughput}
                            storageGroupsCount={
                                tenant?.StorageGroups ? Number(tenant?.StorageGroups) : undefined
                            }
                            controlPlaneNodesCount={controlPlaneNodesCount}
                            coresTotal={CoresTotal}
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
