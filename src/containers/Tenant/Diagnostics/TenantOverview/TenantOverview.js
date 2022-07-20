import React from 'react';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';

import EntityStatus from '../../../../components/EntityStatus/EntityStatus';
import InfoViewer from '../../../../components/InfoViewer/InfoViewer';
import PoolUsage from '../../../../components/PoolUsage/PoolUsage';
import Tablet from '../../../../components/Tablet/Tablet';

import {hideTooltip, showTooltip} from '../../../../store/reducers/tooltip';
import {getTenantInfo} from '../../../../store/reducers/tenant';

import {formatCPU} from '../../../../utils';
import {bytesToGB} from '../../../../utils/utils';
import {TABLET_STATES} from '../../../../utils/constants';

import './TenantOverview.scss';
import {AutoFetcher} from '../../../../utils/autofetcher';
import {Loader} from '@yandex-cloud/uikit';

const b = cn('tenant-overview');

const renderName = (tenant) => {
    if (tenant) {
        const {Name} = tenant;
        return (
            <div className={b('tenant-name-wrapper')}>
                <EntityStatus status={tenant.State} />
                <span className={b('tenant-name-trim')}>
                    <span className={b('tenant-name')}>{Name}</span>
                </span>
            </div>
        );
    }

    return <div>no tenant data</div>;
};

class TenantOverview extends React.Component {
    static propTypes = {
        loading: PropTypes.bool,
        autorefresh: PropTypes.bool,
        tenant: PropTypes.object,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
        systemTablets: PropTypes.array,
        additionalTenantInfo: PropTypes.func,
        tenantName: PropTypes.string,
    };

    autofetcher;

    componentDidMount() {
        const {tenantName, autorefresh, getTenantInfo} = this.props;
        this.autofetcher = new AutoFetcher();
        if (autorefresh) {
            this.autofetcher.start();
            this.autofetcher.fetch(() => getTenantInfo({path: tenantName}));
        }
    }

    componentDidUpdate(prevProps) {
        const {autorefresh, tenantName, getTenantInfo} = this.props;
        if (autorefresh && !prevProps.autorefresh) {
            getTenantInfo({path: tenantName});
            this.autofetcher.stop();
            this.autofetcher.start();
            this.autofetcher.fetch(() => getTenantInfo({path: tenantName}));
        }
        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="m" />
            </div>
        );
    };

    render() {
        const {tenant, hideTooltip, showTooltip, loading} = this.props;
        const {
            Metrics = {},
            PoolStats,
            StateStats = [],
            MemoryUsed,
            CoresUsed,
            StorageGroups,
            StorageAllocatedSize,
            Type,
            SystemTablets,
        } = tenant;

        const memoryRaw = MemoryUsed ?? Metrics.Memory;

        const memory = (memoryRaw && bytesToGB(memoryRaw)) || 'no data';
        const storage = (Metrics.Storage && bytesToGB(Metrics.Storage)) || 'no data';
        const storageGroups = StorageGroups ?? 'no data';
        const blobStorage = (StorageAllocatedSize && bytesToGB(StorageAllocatedSize)) || 'no data';
        const storageEfficiency =
            Metrics.Storage && StorageAllocatedSize
                ? `${((Metrics.Storage * 100) / StorageAllocatedSize).toFixed(2)}%`
                : 'no data';

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

        const tabletsInfo = StateStats.map((info) => ({
            label: TABLET_STATES[info.VolatileState],
            value: info.Count,
        }));

        return loading ? (
            this.renderLoader()
        ) : (
            <div className={b()}>
                <div className={b('top-label')}>Database</div>
                <div className={b('top')}>
                    {renderName(tenant)}
                    {this.props.additionalTenantInfo &&
                        this.props.additionalTenantInfo(
                            this.props.tenant.Name,
                            this.props.tenant.Type,
                        )}
                </div>
                <div className={b('system-tablets')}>
                    {SystemTablets &&
                        SystemTablets.map((tablet, tabletIndex) => (
                            <Tablet
                                onMouseEnter={showTooltip}
                                onMouseLeave={hideTooltip}
                                key={tabletIndex}
                                tablet={tablet}
                            />
                        ))}
                </div>
                <div className={b('common-info')}>
                    {PoolStats ? (
                        <div>
                            <div className={b('section-title')}>Pools</div>
                            <div className={b('section', {pools: true})}>
                                {PoolStats.map((pool, poolIndex) => (
                                    <PoolUsage key={poolIndex} data={pool} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="error">no pools data</div>
                    )}
                    <InfoViewer
                        title="Metrics"
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
}

function mapStateToProps(state) {
    const {tenant = {}, loading, data: {status} = {}} = state.tenant;
    const {autorefresh} = state.schema;

    return {
        tenant,
        loading,
        status,
        autorefresh,
    };
}

const mapDispatchToProps = {
    hideTooltip,
    showTooltip,
    getTenantInfo,
};

export default connect(mapStateToProps, mapDispatchToProps)(TenantOverview);
