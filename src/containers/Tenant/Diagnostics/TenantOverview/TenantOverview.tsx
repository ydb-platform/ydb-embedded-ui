import {Loader} from '@gravity-ui/uikit';

import {EntityStatus} from '../../../../components/EntityStatus/EntityStatus';
import {TENANT_METRICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {tenantApi} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
import type {AdditionalNodesProps, AdditionalTenantsProps} from '../../../../types/additionalProps';
import {DEFAULT_POLLING_INTERVAL, TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {useTypedSelector} from '../../../../utils/hooks';
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
    const {metricsTab} = useTypedSelector((state) => state.tenant);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const {
        issueTrees,
        issuesStatistics,
        selfCheckResult,
        loading: healthcheckLoading,
        error: healthcheckError,
        refetch: fetchHealthcheck,
    } = useHealthcheck(tenantName, {autorefresh});

    const {currentData: tenant, isFetching} = tenantApi.useGetTenantInfoQuery(
        {path: tenantName},
        {
            pollingInterval: autorefresh ? DEFAULT_POLLING_INTERVAL : 0,
        },
    );
    const tenantLoading = isFetching && tenant === undefined;
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
    } = calculateTenantMetrics(tenant ?? undefined);

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
                        error={healthcheckError}
                    />
                );
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
                    healthcheckError={healthcheckError}
                />
            </div>
            {renderTabContent()}
        </div>
    );
}
