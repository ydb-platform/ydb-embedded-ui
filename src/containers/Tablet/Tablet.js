import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import cn from 'bem-cn-lite';
import _ from 'lodash';

import {calcUptime} from '../../utils';
import {backend} from '../../store';
import {getTablet, getTabletDescribe} from '../../store/reducers/tablet';
import '../../services/api';

import InfoViewer from '../../components/InfoViewer/InfoViewer';
import EntityStatus from '../../components/EntityStatus/EntityStatus';
import {Tag} from '../../components/Tag/Tag';
import Icon from '../../components/Icon/Icon';
import EmptyState from '../../components/EmptyState/EmptyState';
import {Link as ExternalLink, Button, Loader} from '@yandex-cloud/uikit';
import DataTable from '@yandex-cloud/react-data-table';
import CriticalActionDialog from '../../components/CriticalActionDialog/CriticalActionDialog';
import routes, {createHref} from '../../routes';
import {getDefaultNodePath} from '../Node/NodePages';

import './Tablet.scss';

const b = cn('tablet-page');

const TABLE_SETTINGS = {
    displayIndices: false,
};

const CLUSTERS_COLUMNS = [
    {
        name: 'generation',
        header: 'Generation',
        align: DataTable.RIGHT,
    },
    {
        name: 'nodeId',
        header: 'Node ID',
        align: DataTable.RIGHT,
        sortable: false,
    },
    {
        name: 'changeTime',
        header: 'Change time',
        align: DataTable.RIGHT,
        sortable: false,
        render: ({value}) => calcUptime(value),
    },
    {
        name: 'state',
        header: 'State',
        sortable: false,
    },
    {
        name: 'follower_id',
        header: 'Follower ID',
        sortable: false,
        render: ({row}) => {
            return row.leader ? 'leader' : row.followerId;
        },
    },
];

class Tablet extends React.Component {
    static propTypes = {
        id: PropTypes.string,
        tablet: PropTypes.object,
        loading: PropTypes.bool,
        getTablet: PropTypes.func,
        getTabletDescribe: PropTypes.func,
        tenantPath: PropTypes.string,
        tabletId: PropTypes.string,
    };

    componentDidMount() {
        this.fetchTabletInfo();
    }

    componentDidUpdate(prevProps) {
        const {version} = this.props;

        if (version && !prevProps.version) {
            this.fetchTabletInfo();
        }
    }

    componentWillUnmount() {
        if (this.fetcher) {
            clearInterval(this.fetcher);
        }
    }

    state = {
        typeVisibleDialog: null,
        dialogVisible: false,
        isFirstFetchData: true,
        tenantPath: '-',
        disableTabletActions: false,
    };

    makeShowDialog = (type) => () => this.setState({dialogVisible: true, typeVisibleDialog: type});
    showKillDialog = this.makeShowDialog('kill');
    showStopDialog = this.makeShowDialog('stop');
    showResumeDialog = this.makeShowDialog('resume');
    hideDialog = () => this.setState({dialogVisible: false, typeVisibleDialog: null});

    fetchTabletInfo = () => {
        const {version, id} = this.props;
        const {isFirstFetchData} = this.state;

        if (version && this.isValidVersion()) {
            this.props.getTablet(id).then(({tablet}) => {
                if (isFirstFetchData && tablet.TenantId) {
                    this.props.getTabletDescribe(tablet.TenantId);
                }

                this.setState({isFirstFetchData: false});
            });

            if (this.fetcher) {
                clearInterval(this.fetcher);
                this.fetcher = null;
            }

            this.fetcher = setInterval(() => {
                this.props.getTablet(id).then(() => {
                    this.setState({disableTabletActions: false});
                });
            }, 10000);
        }
    };

    isValidVersion = () => {
        const {version} = this.props;

        if (/\d+.stable-19-6$/.exec(version)) {
            return false;
        } else if (/\d+.stable-29/.exec(version)) {
            return false;
        }

        return true;
    };
    renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }
    renderPlaceholder() {
        return (
            <div className={b('placeholder')}>
                <EmptyState title="The tablet was not found" />
            </div>
        );
    }
    renderExternalLinks = (link, index) => {
        return (
            <li key={index} className={b('link', {external: true})}>
                <ExternalLink href={`${backend}${link.path}`} target="_blank">
                    {link.name}
                </ExternalLink>
            </li>
        );
    };
    _onKillClick = () => {
        const {TabletId: id} = this.props.tablet;

        this.setState({disableTabletActions: true});

        return window.api.killTablet(id);
    };
    _onStopClick = () => {
        const {TabletId: id, HiveId: hiveId} = this.props.tablet;

        this.setState({disableTabletActions: true});

        return window.api.stopTablet(id, hiveId);
    };
    _onResumeClick = () => {
        const {TabletId: id, HiveId: hiveId} = this.props.tablet;

        this.setState({disableTabletActions: true});

        return window.api.resumeTablet(id, hiveId);
    };
    renderDialog = () => {
        const {dialogVisible, typeVisibleDialog} = this.state;

        if (!dialogVisible) {
            return null;
        }

        switch (typeVisibleDialog) {
            case 'kill': {
                return (
                    <CriticalActionDialog
                        visible={dialogVisible}
                        text="The tablet will be killed. Do you want to proceed?"
                        onClose={this.hideDialog}
                        onConfirm={this._onKillClick}
                    />
                );
            }
            case 'stop': {
                return (
                    <CriticalActionDialog
                        visible={dialogVisible}
                        text="The tablet will be stopped. Do you want to proceed?"
                        onClose={this.hideDialog}
                        onConfirm={this._onStopClick}
                    />
                );
            }
            case 'resume': {
                return (
                    <CriticalActionDialog
                        visible={dialogVisible}
                        text="The tablet will be resumed. Do you want to proceed?"
                        onClose={this.hideDialog}
                        onConfirm={this._onResumeClick}
                    />
                );
            }
            default:
                return null;
        }
    };

    hasUptime = () => {
        const {tablet} = this.props;

        return tablet.State === 'Active';
    };

    hasHiveId = () => {
        const {tablet} = this.props;
        const {HiveId} = tablet;

        return HiveId && HiveId !== '0';
    };

    getSchemeShard = () => {
        const {tablet} = this.props;

        return _.get(tablet, 'TenantId.SchemeShard');
    };

    isDisabledResume = () => {
        const {tablet} = this.props;
        const {disableTabletActions} = this.state;

        if (disableTabletActions) {
            return true;
        }

        return tablet.State !== 'Stopped' && tablet.State !== 'Dead';
    };

    isDisabledKill = () => {
        const {disableTabletActions} = this.state;

        return disableTabletActions;
    };

    isDisabledStop = () => {
        const {tablet} = this.props;
        const {disableTabletActions} = this.state;

        if (disableTabletActions) {
            return true;
        }

        return tablet.State === 'Stopped' || tablet.State === 'Deleted';
    };

    renderTablet = () => {
        const {tablet, tenantPath} = this.props;
        const {TabletId: id} = tablet;
        const schemeShard = this.getSchemeShard();

        const tabletInfo = [
            {label: 'Database', value: tenantPath},
            this.hasHiveId()
                ? {
                      label: 'HiveId',
                      value: (
                          <ExternalLink
                              href={createHref(routes.tablet, {id: tablet.HiveId})}
                              target="_blank"
                          >
                              {tablet.HiveId}
                          </ExternalLink>
                      ),
                  }
                : null,
            schemeShard
                ? {
                      label: 'SchemeShard',
                      value: (
                          <ExternalLink
                              href={createHref(routes.tablet, {id: schemeShard})}
                              target="_blank"
                          >
                              {schemeShard}
                          </ExternalLink>
                      ),
                  }
                : null,
            {label: 'Type', value: tablet.Type},
            {label: 'State', value: tablet.State},
            this.hasUptime() ? {label: 'Uptime', value: calcUptime(tablet.ChangeTime)} : null,
            {label: 'Generation', value: tablet.Generation},
            {
                label: 'Node',
                value: (
                    <Link className={b('link')} to={getDefaultNodePath(String(tablet.NodeId))}>
                        {tablet.NodeId}
                    </Link>
                ),
            },
        ].filter(Boolean);

        if (tablet.SlaveId || tablet.FollowerId) {
            tabletInfo.push({label: 'Follower', value: tablet.SlaveId || tablet.FollowerId});
        }

        const externalLinks = [
            {
                name: 'Internal viewer - tablet',
                path: `/tablets?TabletID=${id}`,
            },
        ];

        return (
            <div className={b()}>
                <div className={b('pane-wrapper')}>
                    <div className={b('left-pane')}>
                        <ul className={b('links')}>
                            {externalLinks.map(this.renderExternalLinks)}
                        </ul>
                        <div className={b('row', {header: true})}>
                            <span className={b('title')}>Tablet</span>
                            <EntityStatus status={tablet.Overall} name={tablet.TabletId} />
                            <a
                                rel="noopener noreferrer"
                                className={b('link', {external: true})}
                                href={`${backend}/tablets?TabletID=${tablet.TabletId}`}
                                target="_blank"
                            >
                                <Icon name="external" />
                            </a>
                            {(tablet.Master || tablet.Leader) && <Tag text="Leader" type="blue" />}
                        </div>
                        <InfoViewer info={tabletInfo} />
                        <div className={b('controls')}>
                            <Button
                                onClick={this.showKillDialog}
                                view="action"
                                disabled={this.isDisabledKill()}
                                className={b('control')}
                            >
                                Kill
                            </Button>
                            {this.hasHiveId() ? (
                                <React.Fragment>
                                    <Button
                                        onClick={this.showStopDialog}
                                        view="action"
                                        disabled={this.isDisabledStop()}
                                        className={b('control')}
                                    >
                                        Stop
                                    </Button>
                                    <Button
                                        onClick={this.showResumeDialog}
                                        view="action"
                                        disabled={this.isDisabledResume()}
                                        className={b('control')}
                                    >
                                        Resume
                                    </Button>
                                </React.Fragment>
                            ) : null}
                        </div>
                    </div>
                    <div className={b('rigth-pane')}>
                        <DataTable
                            data={this.props.history}
                            columns={CLUSTERS_COLUMNS}
                            settings={TABLE_SETTINGS}
                            initialSortOrder={{
                                columnId: 'generation',
                                order: DataTable.DESCENDING,
                            }}
                        />
                    </div>
                </div>
                {this.renderDialog()}
            </div>
        );
    };

    renderContent = () => {
        const {tablet} = this.props;
        return tablet && Object.keys(tablet).length
            ? this.renderTablet()
            : this.renderPlaceholder();
    };
    render() {
        const {loading, tabletId, id} = this.props;
        const {isFirstFetchData} = this.state;

        if (this.isValidVersion()) {
            return loading && id !== tabletId && isFirstFetchData
                ? this.renderLoader()
                : this.renderContent();
        }

        return null;
    }
}

const mapStateToProps = (state, ownProps) => {
    const {data: tablet = {}, loading, id: tabletId, history = [], tenantPath} = state.tablet;
    const {id} = ownProps.match.params;
    const {data: host} = state.host;

    return {
        tablet,
        loading,
        id,
        tabletId,
        history,
        version: host.Version,
        tenantPath,
    };
};

const mapDispatchToProps = {
    getTablet,
    getTabletDescribe,
};

export default connect(mapStateToProps, mapDispatchToProps)(Tablet);
