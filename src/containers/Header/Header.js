import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import cn from 'bem-cn-lite';
import {withRouter} from 'react-router-dom';

import Host from '../../containers/Header/Host/Host';

import {backend, clusterName as clusterNameLocation} from '../../store';
import {getHostInfo} from '../../store/reducers/host';
import {getClusterInfo} from '../../store/reducers/cluster';
import {setSettingValue, getSettingValue} from '../../store/reducers/settings';
import {THEME_KEY} from '../../utils/constants';

import './Header.scss';

const b = cn('header');

const ClusterName = ({name}) => (
    <div className={b('cluster-info')}>
        <div className={b('cluster-info-title')}>cluster</div>
        <div className={b('cluster-info-name')}>{name}</div>
    </div>
);
ClusterName.propTypes = {
    name: PropTypes.string,
};

class Header extends React.Component {
    static propTypes = {
        getHostInfo: PropTypes.func,
        host: PropTypes.object,
        pathname: PropTypes.string,
        clusterName: PropTypes.string,
        theme: PropTypes.string,
        setSettingValue: PropTypes.func,
        getSettingValue: PropTypes.func,
        getClusterInfo: PropTypes.func,
        singleClusterMode: PropTypes.bool,
    };
    componentDidMount() {
        const {pathname, clusterName, singleClusterMode} = this.props;
        const isClustersPage = pathname.includes('/clusters');

        if (!isClustersPage && !clusterName && !singleClusterMode) {
            this.props.getClusterInfo(clusterNameLocation);
        }
        this.props.getHostInfo();
    }
    render() {
        const {host, clusterName: clusterNameWeb, singleClusterMode} = this.props;
        const clusterName = singleClusterMode ? host.ClusterName : clusterNameWeb;

        return (
            <header className={b()}>
                <div className={b('content')}>
                    {clusterName && <ClusterName name={clusterName} />}
                </div>
                {host.Host && (
                    <Host host={host} backend={backend} singleClusterMode={singleClusterMode} />
                )}
            </header>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const {singleClusterMode} = state;
    const {data: host} = state.host;
    const {pathname} = ownProps.location;

    return {
        singleClusterMode,
        host,
        pathname,
        theme: getSettingValue(state, THEME_KEY),
        clusterName: state.cluster.data?.Name || state.clusterInfo.title,
    };
};

const mapDispatchToProps = {
    getHostInfo,
    setSettingValue,
    getClusterInfo,
};

const ConnectedHeader = connect(mapStateToProps, mapDispatchToProps)(Header);
export default withRouter(ConnectedHeader);
