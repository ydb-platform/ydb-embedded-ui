import React from 'react';
import {Switch, Route, Redirect, Router, useLocation} from 'react-router-dom';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';

import {ThemeProvider} from '@gravity-ui/uikit';

import routes, {createHref} from '../../routes';

import Cluster from '../Cluster/Cluster';
import Tenant from '../Tenant/Tenant';
import Node from '../Node/Node';
import {Tablet} from '../Tablet';
import TabletsFilters from '../TabletsFilters/TabletsFilters';
import ReduxTooltip from '../ReduxTooltip/ReduxTooltip';
import Header from '../Header/Header';
import AppIcons from '../AppIcons/AppIcons';

import {getParsedSettingValue} from '../../store/reducers/settings/settings';
import {THEME_KEY} from '../../utils/constants';

import './App.scss';
import PropTypes from 'prop-types';
import HistoryContext from '../../contexts/HistoryContext';
import Authentication from '../Authentication/Authentication';
import {clusterTabsIds} from '../Cluster/utils';

const b = cn('app');

export function Content(props) {
    const location = useLocation();

    const {singleClusterMode} = props;
    const isClustersPage =
        location.pathname.includes('/clusters') ||
        (!singleClusterMode && location.pathname === '/');

    const renderRoute = () => {
        const {children: customRoutes} = props;
        return (
            customRoutes || (
                <Switch>
                    <Route path={routes.cluster} component={Cluster} />
                    <Route path={routes.tenant} component={Tenant} />
                    <Route path={routes.node} component={Node} />
                    <Route path={routes.tablet} component={Tablet} />
                    <Route path={routes.tabletsFilters} component={TabletsFilters} />
                    <Redirect
                        to={createHref(routes.cluster, {
                            activeTab: clusterTabsIds.tenants,
                        })}
                    />
                </Switch>
            )
        );
    };
    return (
        <React.Fragment>
            {!isClustersPage && <Header mainPage={props.mainPage} />}
            <main className={b('main')}>{renderRoute()}</main>
            <ReduxTooltip />
            <AppIcons />
        </React.Fragment>
    );
}

Content.propTypes = {
    singleClusterMode: PropTypes.bool,
    children: PropTypes.node,
    clusterName: PropTypes.string,
    mainPage: PropTypes.object,
};

function ContentWrapper(props) {
    const {theme, singleClusterMode, isAuthenticated} = props;
    return (
        <HistoryContext.Consumer>
            {(history) => (
                <Router history={history}>
                    <Switch>
                        <Route path={routes.auth}>
                            <Authentication closable />
                        </Route>
                        <Route>
                            <ThemeProvider theme={theme}>
                                <div className={b({embedded: singleClusterMode})}>
                                    {isAuthenticated ? props.children : <Authentication />}
                                </div>
                            </ThemeProvider>
                        </Route>
                    </Switch>
                </Router>
            )}
        </HistoryContext.Consumer>
    );
}

ContentWrapper.propTypes = {
    theme: PropTypes.string,
    singleClusterMode: PropTypes.bool,
    isAuthenticated: PropTypes.bool,
    children: PropTypes.node,
};

function mapStateToProps(state) {
    return {
        theme: getParsedSettingValue(state, THEME_KEY),
        isAuthenticated: state.authentication.isAuthenticated,
        singleClusterMode: state.singleClusterMode,
    };
}

export default connect(mapStateToProps)(ContentWrapper);
