import cn from 'bem-cn-lite';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {Loader} from '@gravity-ui/uikit';

import {formatBytes} from '../../../../utils/bytesParsers';
import {InfoViewer} from '../../../../components/InfoViewer';
import {PoolUsage} from '../../../../components/PoolUsage/PoolUsage';
import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import {TABLET_STATES, TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {mapDatabaseTypeToDBName} from '../../utils/schema';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import type {ETabletVolatileState} from '../../../../types/api/tenant';
import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import {getTenantInfo, setDataWasNotLoaded} from '../../../../store/reducers/tenant/tenant';
import {
    formatTenantMetrics,
    calculateTenantMetrics,
} from '../../../../store/reducers/tenants/utils';
import {MetricsCards, type TenantMetrics} from './MetricsCards/MetricsCards';

import i18n from './i18n';
import './TenantOverview.scss';

const b = cn('tenant-overview');

interface TenantOverviewProps {
    tenantName: string;
    additionalTenantProps?: AdditionalTenantsProps;
    showMoreHandler?: VoidFunction;
}

export function TenantOverview({
    tenantName,
    additionalTenantProps,
    showMoreHandler,
}: TenantOverviewProps) {
    const dispatch = useDispatch();

    const {tenant, loading, wasLoaded} = useTypedSelector((state) => state.tenant);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const fetchTenant = useCallback(
        (isBackground = true) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }
            dispatch(getTenantInfo({path: tenantName}));
        },
        [dispatch, tenantName],
    );

    useAutofetcher(fetchTenant, [fetchTenant], autorefresh);

    const {
        Metrics = {},
        PoolStats,
        StateStats = [],
        Name,
        State,
        StorageGroups,
        StorageAllocatedSize,
        Type,
    } = tenant || {};

    const tenantType = mapDatabaseTypeToDBName(Type);

    const {cpu, storage, memory, cpuLimit, storageLimit, memoryLimit} =
        calculateTenantMetrics(tenant);

    const calculatedMetrics: TenantMetrics = {
        memoryUsed: memory,
        memoryLimit,
        cpuUsed: cpu,
        cpuLimit,
        storageUsed: storage,
        storageLimit,
    };

    const formattedMetrics = formatTenantMetrics({cpu, storage, memory});

    const storageGroups = StorageGroups ?? i18n('no-data');
    const tabletStorage =
        (Metrics.Storage && formatBytes({value: Metrics.Storage})) || i18n('no-data');
    const storageEfficiency =
        Metrics.Storage && StorageAllocatedSize
            ? `${((parseInt(Metrics.Storage) * 100) / parseInt(StorageAllocatedSize)).toFixed(2)}%`
            : i18n('no-data');

    const metricsInfo = [
        {label: 'Type', value: Type},
        {label: 'Memory', value: formattedMetrics.memory},
        {label: 'CPU', value: formattedMetrics.cpu},
        {label: 'Tablet storage', value: tabletStorage},
        {label: 'Storage groups', value: storageGroups},
        {label: 'Blob storage', value: formattedMetrics.storage},
        {label: 'Storage efficiency', value: storageEfficiency},
    ];

    const tabletsInfo = StateStats.filter(
        (item): item is {VolatileState: ETabletVolatileState; Count: number} => {
            return item.VolatileState !== undefined && item.Count !== undefined;
        },
    ).map((info) => {
        return {label: TABLET_STATES[info.VolatileState], value: info.Count};
    });

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

    if (loading && !wasLoaded) {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    }

    return (
        <div className={b()}>
            <div className={b('top-label')}>{tenantType}</div>
            <div className={b('top')}>
                {renderName()}
                {additionalTenantProps?.getMonitoringLink?.(Name, Type)}
            </div>
            <MetricsCards
                tenantName={tenantName}
                metrics={calculatedMetrics}
                showMoreHandler={showMoreHandler}
            />
            <div className={b('common-info')}>
                <div>
                    <div className={b('section-title')}>{i18n('title.pools')}</div>
                    {PoolStats ? (
                        <div className={b('section', {pools: true})}>
                            {PoolStats.map((pool, poolIndex) => (
                                <PoolUsage key={poolIndex} data={pool} />
                            ))}
                        </div>
                    ) : (
                        <div className="error">{i18n('no-pools-data')}</div>
                    )}
                </div>
                <InfoViewer
                    title={i18n('title.metrics')}
                    className={b('section', {metrics: true})}
                    info={metricsInfo}
                />

                <div className={b('section')}>
                    <InfoViewer info={tabletsInfo} title="Tablets" />
                </div>
            </div>
        </div>
    );
}
