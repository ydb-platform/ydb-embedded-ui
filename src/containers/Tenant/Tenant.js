import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';
import qs from 'qs';

import {Loader, Tabs} from '@yandex-cloud/uikit';

import TenantOverview from '../../components/TenantOverview/TenantOverview';
import Storage from '../StorageV2/Storage';
import Compute from '../Tenant/Compute/Compute';
import SchemaMain from '../Tenant/Schema/SchemaMain/SchemaMain';
import Network from '../Tenant/Network/Network';
import EmptyState from '../../components/EmptyState/EmptyState';
import {INFO} from './Schema/SchemaPages';
import Healthcheck from './Healthcheck/Healthcheck';
import {HEALTHCHECK, STORAGE, COMPUTE, SCHEMA, TENANT_PAGES, NETWORK} from './TenantPages';

import Icon from '../../components/Icon/Icon';

import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {getTenantInfo, clearTenant} from '../../store/reducers/tenant';
import routes, {createHref} from '../../routes';

import './Tenant.scss';

const b = cn('tenant-page');

class Tenant extends React.Component {
    static propTypes = {
        history: PropTypes.object,
        name: PropTypes.string,
        getTenantInfo: PropTypes.func,
        tenant: PropTypes.object,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        clearTenant: PropTypes.func,
        activeTab: PropTypes.string,
        systemTablets: PropTypes.array,
        hideTooltip: PropTypes.func,
        showTooltip: PropTypes.func,
        tenantName: PropTypes.string,
        schemaTab: PropTypes.string,
        additionalTenantInfo: PropTypes.func,
        additionalNodesInfo: PropTypes.object,
        getBackend: PropTypes.func,
    };
    componentDidMount() {
        const {tenantName} = this.props;
        if (tenantName) {
            this.props.getTenantInfo({path: tenantName});
        }
    }
    renderLoader() {
        return (
            <div className={b('loader')}>
                <Loader size="l" />
            </div>
        );
    }
    renderTabs() {
        const {activeTab, tenantName} = this.props;

        const pages = TENANT_PAGES.map((page) => {
            return {
                ...page,
                path: createHref(routes.tenant, {page: page.id}, {name: tenantName}),
                title: (
                    <div className={b('tab-label')}>
                        {page.icon}
                        {page.name}
                    </div>
                ),
            };
        });

        return (
            <div className={b('tabs')}>
                <Tabs
                    items={pages}
                    activeTab={activeTab}
                    wrapTo={({path, id}, node) => (
                        <Link to={path} key={id} className={b('tab')}>
                            {node}
                        </Link>
                    )}
                    allowNotSelected={true}
                />
            </div>
        );
    }
    renderTabContent() {
        const {activeTab, tenantName, schemaTab, queryParams, getBackend} = this.props;

        switch (activeTab) {
            case HEALTHCHECK: {
                return (
                    <Healthcheck
                        tenant={tenantName}
                        hideTooltip={this.props.hideTooltip}
                        showTooltip={this.props.showTooltip}
                    />
                );
            }
            case STORAGE: {
                return (
                    <div className={b('storage')}>
                        <Storage tenant={tenantName} />
                    </div>
                );
            }
            case COMPUTE: {
                return <Compute additionalNodesInfo={this.props.additionalNodesInfo} />;
            }
            case SCHEMA: {
                return (
                    <SchemaMain
                        activeTab={schemaTab}
                        tenantName={tenantName}
                        tenantActiveTab={activeTab}
                        queryParams={queryParams}
                        getBackend={getBackend}
                    />
                );
            }
            case NETWORK: {
                return <Network path={tenantName} />;
            }
            default:
                return false;
        }
    }
    render() {
        const {tenant, loading, status} = this.props;
        const {SystemTablets} = tenant;
        if (status === 403) {
            return (
                <EmptyState
                    title="403 Access denied"
                    image={
                        <Icon name="accessDenied" viewBox="0 0 240 240" width={240} height={240} />
                    }
                />
            );
        }

        return loading ? (
            this.renderLoader()
        ) : (
            <div className={b()}>
                <div className={b('info')}>
                    <TenantOverview
                        systemTablets={SystemTablets}
                        tenant={tenant}
                        hideTooltip={this.props.hideTooltip}
                        showTooltip={this.props.showTooltip}
                        additionalTenantInfo={this.props.additionalTenantInfo}
                    />
                    {this.renderTabs()}
                </div>
                <div className={b('content')}>{this.renderTabContent()}</div>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const queryParams = qs.parse(ownProps.location.search, {
        ignoreQueryPrefix: true,
    });
    const {name: tenantName, schemaTab = INFO} = queryParams;

    const {tenant = {}, systemTablets = [], loading, data: {status} = {}} = state.tenant;
    const {page: activeTab} = ownProps.match.params;
    const {NodeId: currentBackendId} = state.host.data;

    return {
        activeTab,
        tenant,
        systemTablets,
        tenantName,
        loading,
        schemaTab,
        currentBackendId,
        status,
        queryParams,
    };
};

const mapDispatchToProps = {
    getTenantInfo,
    clearTenant,
    hideTooltip,
    showTooltip,
};

export default connect(mapStateToProps, mapDispatchToProps)(Tenant);
