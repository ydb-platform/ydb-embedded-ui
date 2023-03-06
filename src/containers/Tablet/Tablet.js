import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';

import {backend} from '../../store';
import {getTablet, getTabletDescribe} from '../../store/reducers/tablet';
import '../../services/api';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import {Tag} from '../../components/Tag';
import {Icon} from '../../components/Icon';
import {EmptyState} from '../../components/EmptyState';
import {Link as ExternalLink, Button, Loader} from '@gravity-ui/uikit';
import {CriticalActionDialog} from '../../components/CriticalActionDialog';

import {TabletTable} from './TabletTable';
import {TabletInfo} from './TabletInfo';
import {TabletControls} from './TabletControls';

import './Tablet.scss';

export const b = cn('tablet-page');

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
        isFirstFetchData: true,
        tenantPath: '-',
    };

    fetchTabletInfo = () => {
        const {version, id} = this.props;
        const {isFirstFetchData} = this.state;

        if (version && this.isValidVersion()) {
            this.props.getTablet(id).then(({tabletData}) => {
                if (isFirstFetchData && tabletData.TenantId) {
                    this.props.getTabletDescribe(tabletData.TenantId);
                }

                this.setState({isFirstFetchData: false});
            });

            if (this.fetcher) {
                clearInterval(this.fetcher);
                this.fetcher = null;
            }

            this.fetcher = setInterval(() => {
                this.props.getTablet(id);
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

    renderTablet = () => {
        const {tablet, tenantPath} = this.props;
        const {TabletId: id} = tablet;

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
                        <TabletInfo tablet={tablet} tenantPath={tenantPath} />
                        <TabletControls tablet={tablet} />
                    </div>
                    <div className={b('rigth-pane')}>
                        <TabletTable history={this.props.history} />
                    </div>
                </div>
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
