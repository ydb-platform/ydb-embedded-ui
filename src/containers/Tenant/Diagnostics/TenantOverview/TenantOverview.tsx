import cn from 'bem-cn-lite';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {Loader} from '@gravity-ui/uikit';

import {InfoViewer} from '../../../../components/InfoViewer';
import {PoolUsage} from '../../../../components/PoolUsage/PoolUsage';
import {Tablet} from '../../../../components/Tablet';
import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import {formatCPU} from '../../../../utils';
import {TABLET_STATES, TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {bytesToGB} from '../../../../utils/utils';
import {mapDatabaseTypeToDBName} from '../../utils/schema';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import {ETabletVolatileState} from '../../../../types/api/tenant';
import {getTenantInfo, setDataWasNotLoaded} from '../../../../store/reducers/tenant/tenant';

import i18n from './i18n';
import './TenantOverview.scss';

const b = cn('tenant-overview');

interface TenantOverviewProps {
    tenantName: string;
    additionalTenantInfo?: any;
}

export function TenantOverview({tenantName, additionalTenantInfo}: TenantOverviewProps) {
    const {tenant, loading, wasLoaded} = useTypedSelector((state) => state.tenant);
    const {autorefresh} = useTypedSelector((state) => state.schema);
    const dispatch = useDispatch();
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
        MemoryUsed,
        Name,
        State,
        CoresUsed,
        StorageGroups,
        StorageAllocatedSize,
        Type,
        SystemTablets,
    } = tenant || {};

    const tenantType = mapDatabaseTypeToDBName(Type);
    const memoryRaw = MemoryUsed ?? Metrics.Memory;

    const memory = (memoryRaw && bytesToGB(memoryRaw)) || i18n('no-data');
    const storage = (Metrics.Storage && bytesToGB(Metrics.Storage)) || i18n('no-data');
    const storageGroups = StorageGroups ?? i18n('no-data');
    const blobStorage =
        (StorageAllocatedSize && bytesToGB(StorageAllocatedSize)) || i18n('no-data');
    const storageEfficiency =
        Metrics.Storage && StorageAllocatedSize
            ? `${((parseInt(Metrics.Storage) * 100) / parseInt(StorageAllocatedSize)).toFixed(2)}%`
            : i18n('no-data');

    const cpuRaw = CoresUsed !== undefined ? Number(CoresUsed) * 1_000_000 : Metrics.CPU;

    const cpu = formatCPU(cpuRaw);

    const metricsInfo = [
        {label: 'Type', value: Type},
        {label: 'Memory', value: memory},
        {label: 'CPU', value: cpu},
        {label: 'Tablet storage', value: storage},
        {label: 'Storage groups', value: storageGroups},
        {label: 'Blob storage', value: blobStorage},
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
                {tenant && additionalTenantInfo && additionalTenantInfo(tenant.Name, tenant.Type)}
            </div>
            <div className={b('system-tablets')}>
                {SystemTablets &&
                    SystemTablets.map((tablet, tabletIndex) => (
                        <Tablet key={tabletIndex} tablet={tablet} tenantName={Name} />
                    ))}
            </div>
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
