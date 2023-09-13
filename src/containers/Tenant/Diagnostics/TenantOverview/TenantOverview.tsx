import cn from 'bem-cn-lite';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {Loader} from '@gravity-ui/uikit';

import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import {TENANT_DEFAULT_TITLE} from '../../../../utils/constants';
import {TENANT_METRICS_TABS_IDS} from '../../../../store/reducers/tenant/constants';
import {mapDatabaseTypeToDBName} from '../../utils/schema';
import {useAutofetcher, useTypedSelector} from '../../../../utils/hooks';
import type {AdditionalTenantsProps} from '../../../../types/additionalProps';
import {getTenantInfo, setDataWasNotLoaded} from '../../../../store/reducers/tenant/tenant';
import {calculateTenantMetrics} from '../../../../store/reducers/tenants/utils';
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
    const {metricsTab} = useTypedSelector((state) => state.tenant);
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

    const {Name, State, Type} = tenant || {};

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
                return i18n('label.under-development');
            }
            case TENANT_METRICS_TABS_IDS.storage: {
                return i18n('label.under-development');
            }
            case TENANT_METRICS_TABS_IDS.memory: {
                return i18n('label.under-development');
            }
            case TENANT_METRICS_TABS_IDS.healthcheck: {
                return i18n('label.under-development');
            }
            default: {
                return undefined;
            }
        }
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
            {renderTabContent()}
        </div>
    );
}
