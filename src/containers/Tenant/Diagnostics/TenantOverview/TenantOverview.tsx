import cn from 'bem-cn-lite';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {Loader} from '@gravity-ui/uikit';

import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {TENANT_METRICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {mapDatabaseTypeToDBName} from '../../utils/schema';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../../types/additionalProps';
import {getTenantInfo, setDataWasNotLoaded} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import {TenantCpu} from './TenantCpu/TenantCpu';
import {HealthcheckDetails} from './Healthcheck/HealthcheckDetails';
import {MetricsCards, type TenantMetrics} from './MetricsCards/MetricsCards';
import {TenantStorage} from './TenantStorage/TenantStorage';
import {TenantMemory} from './TenantMemory/TenantMemory';
import {DefaultDashboard} from './DefaultDashboard';
import {useHealthcheck} from './useHealthcheck';

import './TenantOverview.scss';

const b = cn('tenant-overview');

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
    const dispatch = useDispatch();

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

    const fetchTenant = useCallback(
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

    const {Name, State, Type} = tenant || {};

    const tenantType = mapDatabaseTypeToDBName(Type);

    const {
        cpu,
        blobStorage,
        tableStorage,
        memory,
        cpuUsage,
        blobStorageLimit,
        tableStorageLimit,
        memoryLimit,
    } = calculateTenantMetrics(tenant);

    const calculatedMetrics: TenantMetrics = {
        memoryUsed: memory,
        memoryLimit,
        cpuUsed: cpu,
        cpuUsage,
        storageUsed: blobStorage,
        storageLimit: blobStorageLimit,
    };

    const storageMetrics = {
        blobStorageUsed: blobStorage,
        blobStorageLimit,
        tableStorageUsed: tableStorage,
        tableStorageLimit,
    };

    const renderName = () => {
        return (
            <div className={b('tenant-name-wrapper')}>
                <EntityStatus
                    status={State}
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
                return <DefaultDashboard />;
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
                    metrics={calculatedMetrics}
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
