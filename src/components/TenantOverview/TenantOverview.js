import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';

import {Collapse} from '../Collapse/Collapse';
import EntityStatus from '../EntityStatus/EntityStatus';
import InfoViewer from '../InfoViewer/InfoViewer';
import PoolUsage from '../PoolUsage/PoolUsage';
import Tablet from '../Tablet/Tablet';
import InternalLink from '../InternalLink/InternalLink';

import {TABLET_STATES} from '../../utils/constants';
import {formatCPU} from '../../utils';
import {bytesToGB} from '../../utils/utils';
import routes, {createHref} from '../../routes';
import {HEALTHCHECK} from '../../containers/Tenant/TenantPages';

import './TenantOverview.scss';

const b = cn('tenant-overview');

const renderName = (tenant) => {
    if (tenant) {
        const {Name} = tenant;
        return (
            <React.Fragment>
                <InternalLink to={createHref(routes.tenant, {page: HEALTHCHECK}, {name: Name})}>
                    <EntityStatus status={tenant.State} />
                </InternalLink>
                <span>{Name}</span>
            </React.Fragment>
        );
    }

    return <div>no tenant data</div>;
};

class TenantOverview extends React.Component {
    static propTypes = {
        tenant: PropTypes.object,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
        systemTablets: PropTypes.array,
        additionalTenantInfo: PropTypes.func,
    };

    onChangeCollapseState = () => {
        window.dispatchEvent(new Event('resize'));
    };

    render() {
        const {tenant, systemTablets, hideTooltip, showTooltip} = this.props;
        const {
            Metrics = {},
            PoolStats,
            StateStats = [],
            MemoryUsed,
            CoresUsed,
            StorageGroups,
            StorageAllocatedSize,
            Type,
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

        const collapseTitle = <span className={b('collapse-title')}>Database info</span>;

        return (
            <div className={b()}>
                <div className={b('top')}>
                    <span className={b('top-label')}>database</span>
                    {renderName(tenant)}
                    {this.props.additionalTenantInfo &&
                        this.props.additionalTenantInfo(
                            this.props.tenant.Name,
                            this.props.tenant.Type,
                        )}
                    <div className={b('system-tablets')}>
                        {systemTablets &&
                            systemTablets.map((tablet, tabletIndex) => (
                                <Tablet
                                    onMouseEnter={showTooltip}
                                    onMouseLeave={hideTooltip}
                                    key={tabletIndex}
                                    tablet={tablet}
                                />
                            ))}
                    </div>
                </div>
                <Collapse title={collapseTitle} onChange={this.onChangeCollapseState} titleSize="m">
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
                </Collapse>
            </div>
        );
    }
}

export default TenantOverview;
