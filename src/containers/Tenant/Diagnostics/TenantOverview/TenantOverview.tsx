import React from 'react';

import {Button, Flex, Icon} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {ResponseError} from '../../../../components/Errors/ResponseError';
import {LoaderWrapper} from '../../../../components/LoaderWrapper/LoaderWrapper';
import {QueriesActivityBar} from '../../../../components/QueriesActivityBar/QueriesActivityBar';
import {ServerlessDBLabel} from '../../../../components/ServerlessDBLabel/ServerlessDBLabel';
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
import type {ETenantType, TTenant} from '../../../../types/api/tenant';
import {getInfoTabLinks} from '../../../../utils/additionalProps';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {useClusterNameFromQuery} from '../../../../utils/hooks/useDatabaseFromQuery';
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
import type {MetricPageSummaries} from './metricOverview';
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

function shouldSkipHealthcheck({
    isServerless,
    isV2NavigationEnabled,
    tenant,
}: {
    isServerless: boolean;
    isV2NavigationEnabled: boolean;
    tenant?: TTenant;
}) {
    return isServerless || isV2NavigationEnabled || tenant === undefined;
}

function getDatabaseStatus(overall?: EFlag, selfCheckResult?: SelfCheckResult) {
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
    name,
    hasTenant,
    isServerless,
}: {
    databaseStatus?: EFlag;
    name?: string;
    hasTenant: boolean;
    isServerless: boolean;
}) {
    return (
        <Flex alignItems="center" style={{overflow: 'hidden'}}>
            <EntityStatus
                status={databaseStatus}
                name={name || TENANT_DEFAULT_TITLE}
                withLeftTrim
                hasClipboardButton={hasTenant}
                clipboardButtonAlwaysVisible
            />
            {isServerless ? <ServerlessDBLabel className={b('serverless-tag')} /> : null}
        </Flex>
    );
}

function renderTenantError(error: unknown) {
    return error ? <ResponseError error={error} /> : null;
}

function renderHealthcheckPreview({
    database,
    isServerless,
    isV2NavigationEnabled,
}: {
    database: string;
    isServerless: boolean;
    isV2NavigationEnabled: boolean;
}) {
    return !isServerless && !isV2NavigationEnabled ? (
        <HealthcheckPreview database={database} />
    ) : null;
}

function renderOverviewHead({
    databaseStatus,
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
    blobStorageStats,
    database,
    databaseFullPath,
    databaseType,
    metricPageSummaries,
    memoryLimit,
    memoryStats,
    memoryUsed,
    storageMetrics,
    tabletStorageStats,
}: {
    activeMetricsTab: TenantMetricsTab;
    blobStorageStats?: TenantStorageStats[];
    database: string;
    databaseFullPath: string;
    databaseType?: ETenantType;
    metricPageSummaries: MetricPageSummaries;
    memoryLimit?: string;
    memoryStats?: TMemoryStats;
    memoryUsed?: string;
    storageMetrics: TenantStorageMetrics;
    tabletStorageStats?: TenantStorageStats[];
}) {
    switch (activeMetricsTab) {
        case TENANT_METRICS_TABS_IDS.cpu: {
            return (
                <TenantCpu
                    database={database}
                    databaseType={databaseType}
                    databaseFullPath={databaseFullPath}
                    metricSummary={metricPageSummaries.cpu}
                />
            );
        }
        case TENANT_METRICS_TABS_IDS.storage: {
            return (
                <TenantStorageMode
                    database={database}
                    databaseFullPath={databaseFullPath}
                    metrics={storageMetrics}
                    blobStorageStats={blobStorageStats}
                    tabletStorageStats={tabletStorageStats}
                    databaseType={databaseType}
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
                    metricSummary={metricPageSummaries.memory}
                />
            );
        }
        case TENANT_METRICS_TABS_IDS.network: {
            return (
                <TenantNetwork database={database} metricSummary={metricPageSummaries.network} />
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
    const {Name, Type, Overall, CoresTotal} = tenant || {};
    const isServerless = Type === 'Serverless';

    // Use healthcheck self_check_result as the database status color when available;
    // fall back to tenantinfo.Overall (e.g. for Serverless databases where healthcheck is skipped).
    // Polling is managed by HealthcheckPreview (deduped via the same cache key); the database
    // status badge is only rendered when !isV2NavigationEnabled, so skip the query in V2 mode
    // and until tenant info is loaded to avoid spurious requests.
    const {currentData: healthcheckData} = healthcheckApi.useGetHealthcheckInfoQuery(
        {database},
        {
            skip: shouldSkipHealthcheck({isServerless, isV2NavigationEnabled, tenant}),
        },
    );
    const databaseStatus = getDatabaseStatus(Overall, healthcheckData?.self_check_result);
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
    } = calculateTenantMetrics(tenant);

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
            networkThroughput,
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
        networkThroughput,
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
            {renderTenantError(error)}
            <div className={b()}>
                <div className={b('info')}>
                    {renderOverviewHead({
                        databaseStatus,
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
                        {renderHealthcheckPreview({
                            database,
                            isServerless,
                            isV2NavigationEnabled,
                        })}
                        <QueriesActivityBar database={database} />
                        <MetricsTabs
                            metrics={metricOverview.tabs}
                            databaseType={Type}
                            activeTab={activeMetricsTab}
                        />
                    </Flex>
                </div>
                <div className={b('tab-content')}>
                    {renderMetricsTabContent({
                        activeMetricsTab,
                        blobStorageStats,
                        database,
                        databaseFullPath,
                        databaseType: Type,
                        metricPageSummaries: metricOverview.summaries,
                        memoryLimit: tenant?.MemoryLimit,
                        memoryStats: tenant?.MemoryStats,
                        memoryUsed: tenant?.MemoryUsed,
                        storageMetrics,
                        tabletStorageStats,
                    })}
                </div>
            </div>
        </LoaderWrapper>
    );
}
