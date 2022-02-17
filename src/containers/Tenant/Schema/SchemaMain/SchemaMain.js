import React from 'react';
import cn from 'bem-cn-lite';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import _ from 'lodash';

import {
    Link as ExternalLink,
    Tabs,
    ClipboardButton,
    HelpTooltip,
    Switch,
} from '@yandex-cloud/uikit';
import SplitPane from '../../../../components/SplitPane';

import Info from '../Info/Info';
import {
    GENERAL_SCHEMA_PAGES,
    TABLETS,
    INFO,
    QUERY,
    GRAPH,
    PREVIEW,
    DESCRIBE,
    ACL,
    TOP_QUERIES,
    TOP_SHARDS,
    HOT_KEYS,
    TABLE_SCHEMA_PAGES,
} from '../SchemaPages';
import QueryEditor from '../../../Tenant/QueryEditor/QueryEditor';
import Preview from '../../../Tenant/Preview/Preview';
import Tablets from '../../../Tablets/Tablets';
import Heatmap from '../../../Heatmap/Heatmap';
import Describe from '../../../Tenant/Describe/Describe';
import Acl from '../../../Tenant/Acl/Acl';
import TopQueries from '../../../Tenant/TopQueries/TopQueries';
import TopShards from '../../../Tenant/TopShards/TopShards';
import SchemaNode from '../SchemaNode/SchemaNode';
import HotKeys from '../HotKeys/HotKeys';

import {getDescribe} from '../../../../store/reducers/describe';
import {getSchemaAcl} from '../../../../store/reducers/schemaAcl';
import {getSchema, enableAutorefresh, disableAutorefresh} from '../../../../store/reducers/schema';
import {getOlapStats} from '../../../../store/reducers/olapStats';
import {DEFAULT_SIZE_SHEMA_TREE_PANE_KEY} from '../../../../utils/constants';
import routes, {createHref} from '../../../../routes';

import {AutoFetcher} from '../../../Cluster/Cluster';

import './SchemaMain.scss';
import HistoryContext from '../../../../contexts/HistoryContext';
const b = cn('schema-main');

export const TABLE_TYPE = 'Table';
export const OLAP_TABLE_TYPE = 'OlapTable';
export const OLAP_STORE_TYPE = 'OlapStore';

class SchemaMain extends React.Component {
    static propTypes = {
        tenantName: PropTypes.string,
        activeTab: PropTypes.string,
        currentItem: PropTypes.object,
        tenant: PropTypes.object,
        tenantNodes: PropTypes.array,
        tenantActiveTab: PropTypes.string,
        host: PropTypes.object,
        singleClusterMode: PropTypes.bool,
        getBackend: PropTypes.func,
    };

    autofetcher;

    state = {
        entityType: '',
    };

    componentDidMount() {
        this.autofetcher = new AutoFetcher();
        this.autofetcher.active = false;
        this.fetchData();
        this.setState({entityType: this.getEntityType()});
    }

    componentDidUpdate(prevProps) {
        const {
            autorefresh,
            schemaPath,
            disableAutorefresh,
            activeTab,
            getOlapStats,
            schemaPath: path,
        } = this.props;

        const entityType = this.getEntityType();

        if (entityType !== this.state.entityType) {
            this.setState({entityType});
            if (entityType === OLAP_TABLE_TYPE) {
                getOlapStats({path});
            }
        }

        if (schemaPath !== prevProps.schemaPath) {
            this.fetchData();
            if (autorefresh) {
                disableAutorefresh();
                this.autofetcher.stop();
            }
        }
        switch (activeTab) {
            case INFO:
            case DESCRIBE:
            case ACL:
                if (!this.autofetcher.active && autorefresh) {
                    this.fetchData();
                    this.autofetcher.start();
                    this.autofetcher.fetch(() => this.fetchData());
                }
                break;

            default:
                if (this.autofetcher.active) {
                    this.autofetcher.stop();
                }
        }

        if (!autorefresh && prevProps.autorefresh) {
            this.autofetcher.stop();
        }
    }
    componentWillUnmount() {
        this.autofetcher.stop();
    }

    fetchData = () => {
        const {
            getSchema,
            getDescribe,
            getSchemaAcl,
            schemaPath: path,
            tenantName,
            getOlapStats,
        } = this.props;

        const entityType = this.getEntityType();

        if (entityType === OLAP_TABLE_TYPE) {
            getOlapStats({path});
        }

        getSchema({path: tenantName});
        getSchema({path});
        getDescribe({path});
        getSchemaAcl({path});
    };

    changeSchemaTab = (tab) => {
        const {tenantName, tenantActiveTab, queryParams} = this.props;
        this.history.push(
            createHref(
                routes.tenant,
                {page: tenantActiveTab},
                {...queryParams, name: tenantName, schemaTab: tab},
            ),
        );
    };
    renderSchemaTab() {
        const {currentItem, tenantName, activeTab, tenant, theme, olapStats} = this.props;
        const entityType = this.getEntityType();
        const tableSchema =
            currentItem?.PathDescription?.Table ||
            currentItem?.PathDescription?.OlapTableDescription;

        if (currentItem.Status !== 'StatusSuccess') {
            return <div>no data</div>;
        }

        switch (activeTab) {
            case QUERY: {
                return <QueryEditor path={tenantName} theme={theme} />;
            }
            case TABLETS: {
                return (
                    <Tablets
                        tenant={tenant}
                        currentSchemaItem={currentItem}
                        path={currentItem.Path}
                    />
                );
            }
            case INFO: {
                return (
                    <Info
                        tableSchema={tableSchema}
                        currentItem={currentItem}
                        type={entityType}
                        olapStats={olapStats}
                    />
                );
            }
            case GRAPH: {
                return (
                    <Heatmap
                        tenant={tenant}
                        currentSchemaItem={currentItem}
                        path={currentItem.Path}
                    />
                );
            }
            case PREVIEW: {
                const partCount = currentItem?.PathDescription?.TableStats?.PartCount;

                return (
                    <Preview
                        database={tenantName}
                        table={currentItem.Path}
                        type={entityType}
                        partCount={partCount}
                    />
                );
            }
            case DESCRIBE: {
                return <Describe />;
            }
            case ACL: {
                return <Acl />;
            }
            case TOP_QUERIES: {
                return (
                    <TopQueries
                        path={tenantName}
                        changeSchemaTab={this.changeSchemaTab}
                        type={entityType}
                    />
                );
            }
            case TOP_SHARDS: {
                return <TopShards path={tenantName} type={entityType} />;
            }
            case HOT_KEYS: {
                if (entityType === TABLE_TYPE) {
                    return <HotKeys path={tenantName} />;
                }
                return this.changeSchemaTab(INFO);
            }
            default:
                return false;
        }
    }
    getEntityType = () => {
        const {currentItem} = this.props;
        const pathType = currentItem?.PathDescription?.Self?.PathType;

        return pathType && pathType.replace('EPathType', '');
    };

    setAutorefresh = () => {
        const {autorefresh, enableAutorefresh, disableAutorefresh} = this.props;
        if (autorefresh) {
            disableAutorefresh();
        } else {
            enableAutorefresh();
        }
    };

    renderInfo = () => {
        const {
            currentItem: {Path, Status, Reason},
            autorefresh,
        } = this.props;
        const entityType = this.getEntityType();

        let message;
        if (!entityType && Status && Reason) {
            message = `${Status}: ${Reason}`;
        }

        return (
            <div className={b('info-wrapper')}>
                <div className={b('info')}>
                    {entityType ? (
                        <div className={b('entity-type')}>{entityType}</div>
                    ) : (
                        <div className={b('entity-type', {error: true})}>
                            <HelpTooltip content={message} offset={{left: 0}} />
                        </div>
                    )}
                    <div>{Path}</div>
                    <span className={b('clipboard-button')}>
                        <ClipboardButton text={Path} size={16} />
                    </span>
                </div>
                <Switch
                    onUpdate={this.setAutorefresh}
                    checked={autorefresh}
                    content="Autorefresh"
                />
            </div>
        );
    };

    onChange = (size) => {
        this.setDefaultSizePane(size);
    };
    setDefaultSizePane = (size) => {
        localStorage.setItem(DEFAULT_SIZE_SHEMA_TREE_PANE_KEY, size);
    };
    getDefaultSizePane = () => {
        let size = localStorage.getItem(DEFAULT_SIZE_SHEMA_TREE_PANE_KEY) || 250;
        size = `${size}px`;

        return size;
    };

    renderContent() {
        const {tenantName, tenantData = null, activeTab} = this.props;
        const entityType = this.getEntityType();

        const pages =
            entityType === TABLE_TYPE
                ? [...GENERAL_SCHEMA_PAGES, ...TABLE_SCHEMA_PAGES]
                : GENERAL_SCHEMA_PAGES;

        return (
            <div className={b()}>
                <SplitPane
                    split="vertical"
                    defaultSize={this.getDefaultSizePane()}
                    maxSize={500}
                    minSize={250}
                    onChange={this.onChange}
                >
                    <div className={b('tree')}>
                        <SchemaNode fullPath={tenantName} data={tenantData} isRoot />
                    </div>
                    <div className={b('content')}>
                        {this.renderInfo()}
                        <div className={b('tabs')}>
                            <Tabs
                                items={pages}
                                activeTab={activeTab}
                                wrapTo={({id}, node) => (
                                    <span
                                        onClick={() => this.changeSchemaTab(id)}
                                        key={id}
                                        className={b('tab')}
                                    >
                                        {node}
                                    </span>
                                )}
                                allowNotSelected={true}
                            />
                        </div>
                        <div className={b('tab-content')}>{this.renderSchemaTab()}</div>
                    </div>
                </SplitPane>
            </div>
        );
    }
    renderHost = (item, index) => {
        const {tenantActiveTab, tenant, activeTab, getBackend} = this.props;
        const {Name: name} = tenant;
        const {backend} = item;
        const href = createHref(
            routes.tenant,
            {page: tenantActiveTab},
            {
                name,
                schemaTab: activeTab,
                backend: getBackend ? getBackend(backend) : undefined,
            },
        );

        return (
            <li className={b('host-link')}>
                <ExternalLink key={index} href={href} target="_self">
                    {backend}
                </ExternalLink>
            </li>
        );
    };
    renderHosts() {
        const {tenantNodes} = this.props;

        return (
            <div className={b('hosts')}>
                <div className={b('hosts-message')}>Select endpoint to browse schema</div>
                <ul className={b('hosts-list')}>{tenantNodes.map(this.renderHost)}</ul>
            </div>
        );
    }
    render() {
        const {tenantNodes = [], host, singleClusterMode} = this.props;
        const correctHost = tenantNodes.map((node) => node.id).includes(host.NodeId);

        return (
            <HistoryContext.Consumer>
                {(history) => {
                    this.history = history;
                    return singleClusterMode || correctHost || !tenantNodes.length
                        ? this.renderContent()
                        : this.renderHosts();
                }}
            </HistoryContext.Consumer>
        );
    }
}

function mapStateToProps(state, ownProps) {
    const {currentSchema = {}, currentSchemaPath, data, autorefresh} = state.schema;
    const {data: olapStats} = state.olapStats;
    const {tenant = {}, tenantNodes} = state.tenant;
    const {data: host} = state.host;
    const {singleClusterMode} = state;

    return {
        singleClusterMode,
        currentItem: currentSchema,
        tenant,
        tenantNodes,
        tenantData: _.get(data[ownProps.tenantName], 'PathDescription.Self'),
        host,
        schemaPath: currentSchemaPath || ownProps.tenantName,
        autorefresh,
        olapStats,
    };
}

const mapDispatchToProps = {
    getDescribe,
    getSchemaAcl,
    getSchema,
    enableAutorefresh,
    disableAutorefresh,
    getOlapStats,
};

export default connect(mapStateToProps, mapDispatchToProps)(SchemaMain);
