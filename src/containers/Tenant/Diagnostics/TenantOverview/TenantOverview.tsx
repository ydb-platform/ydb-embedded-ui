import React from 'react';

import {ActionTooltip, Button, Flex, Icon} from '@gravity-ui/uikit';

import {EntityName} from '../../../../components/EntityName/EntityName';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueriesActivityBar} from '../../../../components/QueriesActivityBar/QueriesActivityBar';
import {ServerlessDBLabel} from '../../../../components/ServerlessDBLabel/ServerlessDBLabel';
import {StatusColor} from '../../../../components/StatusColor/StatusColor';
import {useClusterBaseInfo} from '../../../../store/reducers/cluster/cluster';
import {healthcheckApi} from '../../../../store/reducers/healthcheckInfo/healthcheckInfo';
import {
    hcStatusToColorFlag,
    selfCheckResultToHcStatus,
} from '../../../../store/reducers/healthcheckInfo/utils';
import {
    TENANT_DIAGNOSTICS_TABS_IDS,
    TENANT_METRICS_TABS_IDS,
} from '../../../../store/reducers/tenant/constants';
import {setDiagnosticsTab, tenantApi} from '../../../../store/reducers/tenant/tenant';
import type {TenantMetricsTab} from '../../../../store/reducers/tenant/types';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import type {TenantStorageStats} from '../../../../store/reducers/tenants/utils';
import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import type {EFlag} from '../../../../types/api/enums';
import type {SelfCheckResult} from '../../../../types/api/healthcheck';
import type {TMemoryStats} from '../../../../types/api/nodes';
import type {ETenantType, TTenant, TTenantResource} from '../../../../types/api/tenant';
import {getInfoTabLinks} from '../../../../utils/additionalProps';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import type {PreparedHealthStatus} from '../../../../utils/healthStatus/healthStatus';
import {getEffectiveHealth} from '../../../../utils/healthStatus/healthStatus';
import {useHealthStatusNow} from '../../../../utils/healthStatus/useHealthStatusNow';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useClusterNameFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
import {useDatabaseHealthcheckAvailable} from '../../../../utils/hooks/useDatabaseHealthcheckAvailable';
import {useDatabasesV2} from '../../../../utils/hooks/useDatabasesV2';
import {canShowTenantMonitoringTab} from '../../../../utils/monitoringVisibility';
import {useTenantPage} from '../../TenantNavigation/useTenantNavigation';
import {getTenantPageForDiagnosticsTab} from '../../utils/diagnosticsNavigation';
import {mapDatabaseTypeToDBName} from '../../utils/schema';
import {useNavigationV2Enabled} from '../../utils/useNavigationV2Enabled';

import {HealthcheckPreview} from './Healthcheck/HealthcheckPreview';
import {MetricsTabs} from './MetricsTabs/MetricsTabs';
import {TenantCpu} from './TenantCpu/TenantCpu';
import {TenantMemory} from './TenantMemory/TenantMemory';
import {TenantNetwork} from './TenantNetwork/TenantNetwork';
import {TenantStorageMode} from './TenantStorage/TenantStorageMode';
import type {TenantStorageMetrics} from './TenantStorage/types';
import i18n from './i18n';
import {getTenantOverviewMetrics} from './metricOverview';
import type {TenantOverviewMetrics} from './metricOverview';
import {b} from './utils';

import MoniumIcon from '../../../../assets/icons/monium.svg';

import './TenantOverview.scss';

interface TenantOverviewProps {
    database: string;
    databaseFullPath: string;
    additionalTenantProps?: AdditionalTenantsProps;
}

function isTenantLoading(isFetching: boolean, tenant: TTenant | undefined, error: unknown) {
    return isFetching && tenant === undefined && !error;
}

function getDatabaseStatus(
    tenant?: TTenant & PreparedHealthStatus,
    selfCheckResult?: SelfCheckResult,
) {
    const overall = tenant?.Overall;
    // Prepared Meta health errors (including expiry) take priority over cached Viewer health.
    if (tenant?.error && tenant.healthStatusSource === 'meta') {
        return overall;
    }
    const healthcheckStatus =
        selfCheckResult === undefined ? undefined : selfCheckResultToHcStatus[selfCheckResult];

    if (healthcheckStatus === undefined) {
        return overall;
    }

    return hcStatusToColorFlag[healthcheckStatus] ?? overall;
}

function getActiveMetricsTab(isServerless: boolean, metricsTab: TenantMetricsTab) {
    if (
        isServerless &&
        metricsTab !== TENANT_METRICS_TABS_IDS.cpu &&
        metricsTab !== TENANT_METRICS_TABS_IDS.storage
    ) {
        return TENANT_METRICS_TABS_IDS.cpu;
    }

    return metricsTab;
}

function TenantName({
    databaseStatus,
    databaseStatusNote,
    name,
    hasTenant,
    isServerless,
}: {
    databaseStatus?: EFlag;
    databaseStatusNote?: string;
    name?: string;
    hasTenant: boolean;
    isServerless: boolean;
}) {
    return (
        <Flex alignItems="center" style={{overflow: 'hidden'}}>
            <EntityName
                name={name || TENANT_DEFAULT_TITLE}
                withLeftTrim
                hasClipboardButton={hasTenant}
                clipboardButtonAlwaysVisible
                leadingContent={
                    <ActionTooltip title={databaseStatusNote ?? ''} disabled={!databaseStatusNote}>
                        <span
                            role={databaseStatusNote ? 'img' : undefined}
                            aria-label={databaseStatusNote}
                            tabIndex={databaseStatusNote ? 0 : undefined}
                        >
                            <StatusColor status={databaseStatus} />
                        </span>
                    </ActionTooltip>
                }
            />
            {isServerless ? <ServerlessDBLabel className={b('serverless-tag')} /> : null}
        </Flex>
    );
}

function renderTenantError(error: unknown, defaultMessage: string) {
    return error ? <ResponseError error={error} defaultMessage={defaultMessage} /> : null;
}

function renderOverviewHead({
    databaseStatus,
    databaseStatusNote,
    handleOpenMonitoring,
    hasTenant,
    isServerless,
    isV2NavigationEnabled,
    links,
    monitoringTabAvailable,
    name,
    tenantType,
}: {
    databaseStatus?: EFlag;
    databaseStatusNote?: string;
    handleOpenMonitoring: () => void;
    hasTenant: boolean;
    isServerless: boolean;
    isV2NavigationEnabled: boolean;
    links: ReturnType<typeof getInfoTabLinks>;
    monitoringTabAvailable: boolean;
    name?: string;
    tenantType?: string;
}) {
    if (isV2NavigationEnabled) {
        return null;
    }

    return (
        <React.Fragment>
            <Flex alignItems="center" gap="2" className={b('top-label')}>
                {tenantType}
                {monitoringTabAvailable && (
                    <Button view="normal" onClick={handleOpenMonitoring}>
                        <Icon data={MoniumIcon} size={16} />
                        {i18n('action_open-monitoring')}
                    </Button>
                )}
            </Flex>
            <Flex alignItems="center" gap="1" className={b('top')}>
                <TenantName
                    databaseStatus={databaseStatus}
                    databaseStatusNote={databaseStatusNote}
                    name={name}
                    hasTenant={hasTenant}
                    isServerless={isServerless}
                />
                {links.length > 0 && (
                    <Flex gap="2">
                        {links.map(({title, url, icon}) => (
                            <Button key={title} href={url} target="_blank" size="xs" title={title}>
                                {icon && <Icon data={icon} />}
                            </Button>
                        ))}
                    </Flex>
                )}
            </Flex>
        </React.Fragment>
    );
}

function renderMetricsTabContent({
    activeMetricsTab,
    allocatedResources,
    blobStorageStats,
    database,
    databaseFullPath,
    databaseType,
    metrics,
    memoryLimit,
    memoryStats,
    memoryUsed,
    networkThroughput,
    storageMetrics,
    storageGroupsTotal,
    tabletStorageStats,
}: {
    activeMetricsTab: TenantMetricsTab;
    allocatedResources?: TTenantResource[];
    blobStorageStats?: TenantStorageStats[];
    database: string;
    databaseFullPath: string;
    databaseType?: ETenantType;
    metrics: TenantOverviewMetrics;
    memoryLimit?: string;
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    networkThroughput?: number;
    storageMetrics: TenantStorageMetrics;
    storageGroupsTotal?: string;
    tabletStorageStats?: TenantStorageStats[];
}) {
    switch (activeMetricsTab) {
        case TENANT_METRICS_TABS_IDS.cpu: {
            return (
                <TenantCpu
                    database={database}
                    databaseType={databaseType}
                    databaseFullPath={databaseFullPath}
                    metric={metrics.cpu}
                />
            );
        }
        case TENANT_METRICS_TABS_IDS.storage: {
            return (
                <TenantStorageMode
                    allocatedResources={allocatedResources}
                    database={database}
                    databaseFullPath={databaseFullPath}
                    metrics={storageMetrics}
                    blobStorageStats={blobStorageStats}
                    tabletStorageStats={tabletStorageStats}
                    databaseType={databaseType}
                    storageGroupsTotal={storageGroupsTotal}
                />
            );
        }
        case TENANT_METRICS_TABS_IDS.memory: {
            return (
                <TenantMemory
                    database={database}
                    memoryUsed={memoryUsed}
                    memoryLimit={memoryLimit}
                    memoryStats={memoryStats}
                    metric={metrics.memory}
                />
            );
        }
        case TENANT_METRICS_TABS_IDS.network: {
            return (
                <TenantNetwork
                    database={database}
                    metric={metrics.network}
                    networkThroughput={networkThroughput}
                />
            );
        }
        default: {
            return null;
        }
    }
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

    const {
        currentData: tenant,
        isFetching,
        error,
    } = tenantApi.useGetTenantInfoQuery(
        {database, clusterName, isMetaDatabasesAvailable},
        {pollingInterval: autoRefreshInterval},
    );

    const tenantLoading = isTenantLoading(isFetching, tenant, error);
    const healthNow = useHealthStatusNow([tenant?.healthExpiresAt]);
    const effectiveTenant = tenant ? getEffectiveHealth(tenant, healthNow, error) : tenant;
    const {Name, Type, CoresTotal} = effectiveTenant || {};
    const isServerless = Type === 'Serverless';
    const healthcheckAvailable = useDatabaseHealthcheckAvailable(Type);
    const showHealthcheck = healthcheckAvailable && !isV2NavigationEnabled;

    // Use healthcheck self_check_result as the database status color when available;
    // fall back to tenantinfo.Overall (e.g. for Serverless databases where healthcheck is skipped).
    // Polling is managed by HealthcheckPreview via the same {database, clusterName} cache key. The database
    // status badge is only rendered when !isV2NavigationEnabled, so skip the query in V2 mode
    // and until tenant info is loaded to avoid spurious requests.
    const {currentData: healthcheckData} = healthcheckApi.useGetHealthcheckInfoQuery(
        {database, clusterName},
        {
            skip: !showHealthcheck || tenant === undefined,
        },
    );
    const databaseStatus = getDatabaseStatus(effectiveTenant, healthcheckData?.self_check_result);
    const activeMetricsTab = getActiveMetricsTab(isServerless, metricsTab);

    const tenantType = mapDatabaseTypeToDBName(Type);

    const {
        blobStorage,
        tabletStorage,
        blobStorageLimit,
        tabletStorageLimit,

        poolsStats,
        memoryStats,
        storageMetricStats,
        blobStorageStats,
        tabletStorageStats,
        networkUtilization,
        networkThroughput,
    } = tenant ? calculateTenantMetrics(tenant) : calculateTenantMetrics();

    const storageMetrics = {
        blobStorageUsed: blobStorage,
        blobStorageLimit,
        tabletStorageUsed: tabletStorage,
        tabletStorageLimit,
    };

    const metricOverview = React.useMemo(() => {
        return getTenantOverviewMetrics({
            blobStorageStats,
            coresTotal: CoresTotal,
            isServerless,
            memoryStats,
            networkUtilization,
            poolsStats,
            storageMetricStats,
            tabletStorageStats,
        });
    }, [
        blobStorageStats,
        CoresTotal,
        isServerless,
        memoryStats,
        networkUtilization,
        poolsStats,
        storageMetricStats,
        tabletStorageStats,
    ]);

    const links = getInfoTabLinks(additionalTenantProps, Name, Type);
    const {monitoring: clusterMonitoring} = useClusterBaseInfo();
    const monitoringTabAvailable = canShowTenantMonitoringTab(
        tenant?.ControlPlane,
        clusterMonitoring,
    );

    const handleOpenMonitoring = () => {
        handleTenantPageChange(
            getTenantPageForDiagnosticsTab(
                TENANT_DIAGNOSTICS_TABS_IDS.monitoring,
                isV2NavigationEnabled,
            ),
        );
        dispatch(setDiagnosticsTab(TENANT_DIAGNOSTICS_TABS_IDS.monitoring));
    };

    return (
        <LoaderWrapper loading={tenantLoading}>
            {renderTenantError(
                error ?? tenant?.error,
                i18n('alert_database-information-not-available'),
            )}
            {tenant ? (
                <div className={b()}>
                    <div className={b('info')}>
                        {renderOverviewHead({
                            databaseStatus,
                            databaseStatusNote: effectiveTenant?.error,
                            handleOpenMonitoring,
                            hasTenant: Boolean(tenant),
                            isServerless,
                            isV2NavigationEnabled,
                            links,
                            monitoringTabAvailable,
                            name: Name,
                            tenantType,
                        })}
                        <Flex direction="column" gap={4}>
                            {showHealthcheck && <HealthcheckPreview database={database} />}
                            <QueriesActivityBar database={database} />
                            <MetricsTabs
                                metrics={metricOverview}
                                isServerless={isServerless}
                                activeTab={activeMetricsTab}
                            />
                        </Flex>
                    </div>
                    <div className={b('tab-content')}>
                        {renderMetricsTabContent({
                            activeMetricsTab,
                            allocatedResources: tenant?.Resources?.Allocated,
                            blobStorageStats,
                            database,
                            databaseFullPath,
                            databaseType: Type,
                            metrics: metricOverview,
                            memoryLimit: tenant?.MemoryLimit,
                            memoryStats: tenant?.MemoryStats,
                            memoryUsed: tenant?.MemoryUsed,
                            networkThroughput,
                            storageMetrics,
                            storageGroupsTotal: tenant?.StorageGroups,
                            tabletStorageStats,
                        })}
                    </div>
                </div>
            ) : null}
        </LoaderWrapper>
    );
}
