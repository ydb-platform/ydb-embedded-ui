import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

import ContentWrapper, {Content} from './Content';
import AsideNavigation from '../AsideNavigation/AsideNavigation';

import {getUser} from '../../store/reducers/authentication';
import {registerLanguages} from '../../utils/monaco';

import './App.scss';

registerLanguages();

class App extends React.Component {
    static propTypes = {
        isAuthenticated: PropTypes.bool,
        singleClusterMode: PropTypes.bool,
        clusterName: PropTypes.string,
        children: PropTypes.node,
    };

    componentDidMount() {
        const {isAuthenticated, getUser} = this.props;
        if (isAuthenticated) {
            getUser();
        }
    }

    componentDidUpdate(prevProps) {
        const {isAuthenticated, getUser, internalUser} = this.props;
        if (isAuthenticated && (!prevProps.isAuthenticated || !internalUser)) {
            getUser();
        }
    }

    renderContentWithNavigation() {
        const {singleClusterMode, clusterName} = this.props;
        return (
            <AsideNavigation>
                <Content singleClusterMode={singleClusterMode} clusterName={clusterName} />
                <div id="fullscreen-root"></div>
            </AsideNavigation>
        );
    }

    render() {
        return <ContentWrapper>{this.renderContentWithNavigation()}</ContentWrapper>;
    }
}

function mapStateToProps(state) {
    return {
        isAuthenticated: state.authentication.isAuthenticated,
        internalUser: state.authentication.user,
        singleClusterMode: state.singleClusterMode,
        clusterName: state.cluster.data?.Name,
    };
}

const mapDispatchToProps = {
    getUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
