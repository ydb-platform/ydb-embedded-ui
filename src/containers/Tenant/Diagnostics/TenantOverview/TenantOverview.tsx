import React from 'react';

import {Loader} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {TENANT_METRICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {getTenantInfo, setDataWasNotLoaded} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../../types/additionalProps';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../../../utils/hooks';
import {mapDatabaseTypeToDBName} from '../../utils/schema';

import {DefaultOverviewContent} from './DefaultOverviewContent/DefaultOverviewContent';
import {HealthcheckDetails} from './Healthcheck/HealthcheckDetails';
import {MetricsCards} from './MetricsCards/MetricsCards';
import {TenantCpu} from './TenantCpu/TenantCpu';
import {TenantMemory} from './TenantMemory/TenantMemory';
import {TenantStorage} from './TenantStorage/TenantStorage';
import {useHealthcheck} from './useHealthcheck';
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
    const dispatch = useTypedDispatch();

    const {
        tenant,
        loading: tenantLoading,
        wasLoaded: tenantWasLoaded,
        metricsTab,
    } = useTypedSelector((state) => state.tenant);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        issueTrees,
        issuesStatistics,
        selfCheckResult,
        fetchHealthcheck,
        loading: healthcheckLoading,
        wasLoaded: healthCheckWasLoaded,
        error: healthcheckError,
    } = useHealthcheck(tenantName);

    const fetchTenant = React.useCallback(
        (isBackground = true) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }
            dispatch(getTenantInfo({path: tenantName}));
        },
        [dispatch, tenantName],
    );

    useAutofetcher(
        (isBackground) => {
            fetchTenant(isBackground);
            fetchHealthcheck(isBackground);
        },
        [fetchTenant, fetchHealthcheck],
        autorefresh,
    );

    const {Name, Type, Overall} = tenant || {};

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
    } = calculateTenantMetrics(tenant);

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
                return <TenantCpu path={tenantName} additionalNodesProps={additionalNodesProps} />;
            }
            case TENANT_METRICS_TABS_IDS.storage: {
                return <TenantStorage tenantName={tenantName} metrics={storageMetrics} />;
            }
            case TENANT_METRICS_TABS_IDS.memory: {
                return <TenantMemory path={tenantName} />;
            }
            case TENANT_METRICS_TABS_IDS.healthcheck: {
                return (
                    <HealthcheckDetails
                        issueTrees={issueTrees}
                        loading={healthcheckLoading}
                        wasLoaded={healthCheckWasLoaded}
                        error={healthcheckError}
                    />
                );
            }
            default: {
                return <DefaultOverviewContent database={tenantName} />;
            }
        }
    };

    if (tenantLoading && !tenantWasLoaded) {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    }

    return (
        <div className={b()}>
            <div className={b('info')}>
                <div className={b('top-label')}>{tenantType}</div>
                <div className={b('top')}>
                    {renderName()}
                    {additionalTenantProps?.getMonitoringLink?.(Name, Type)}
                </div>
                <MetricsCards
                    poolsCpuStats={poolsStats}
                    memoryStats={memoryStats}
                    blobStorageStats={blobStorageStats}
                    tabletStorageStats={tabletStorageStats}
                    issuesStatistics={issuesStatistics}
                    selfCheckResult={selfCheckResult}
                    fetchHealthcheck={fetchHealthcheck}
                    healthcheckLoading={healthcheckLoading}
                    healthCheckWasLoaded={healthCheckWasLoaded}
                    healthcheckError={healthcheckError}
                />
            </div>
            {renderTabContent()}
        </div>
    );
}
