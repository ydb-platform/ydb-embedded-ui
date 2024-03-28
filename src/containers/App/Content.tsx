import React from 'react';
import {Switch, Route, Redirect, RedirectProps} from 'react-router-dom';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';

import routes from '../../routes';

import {Clusters} from '../Clusters/Clusters';
import Cluster from '../Cluster/Cluster';
import Tenant from '../Tenant/Tenant';
import Node from '../Node/Node';
import {PDiskPage} from '../PDiskPage/PDiskPage';
import {VDiskPage} from '../VDiskPage/VDiskPage';
import {Tablet} from '../Tablet';
import TabletsFilters from '../TabletsFilters/TabletsFilters';
import Header from '../Header/Header';
import Authentication from '../Authentication/Authentication';

import {ClusterNodesMapContextProvider} from '../../contexts/ClusterNodesMapContext/ClusterNodesMapContext';

import {getUser} from '../../store/reducers/authentication/authentication';
import {getClusterPath} from '../Cluster/utils';
import {useSlots} from '../../components/slots';
import {useTypedSelector, useTypedDispatch} from '../../utils/hooks';
import {
    ClusterSlot,
    ClustersSlot,
    NodeSlot,
    PDiskPageSlot,
    VDiskPageSlot,
    RedirectSlot,
    RoutesSlot,
    TabletSlot,
    TabletsFiltersSlot,
    TenantSlot,
} from './appSlots';

import type {SlotComponent} from '../../components/slots/types';
import type {SlotMap} from '../../components/slots/SlotMap';
import type {RawBreadcrumbItem} from '../Header/breadcrumbs';
import type {RootState} from '../../store';

import i18n from './i18n';
import './App.scss';

const b = cn('app');

type RouteSlot = {
    path: string;
    slot: SlotComponent<any>;
    component: React.ComponentType<any>;
    exact?: boolean;
};
const routesSlots: RouteSlot[] = [
    {
        path: routes.cluster,
        slot: ClusterSlot,
        component: Cluster,
    },
    {
        path: routes.tenant,
        slot: TenantSlot,
        component: Tenant,
    },
    {
        path: routes.node,
        slot: NodeSlot,
        component: Node,
    },
    {
        path: routes.pDisk,
        slot: PDiskPageSlot,
        component: PDiskPage,
    },
    {
        path: routes.vDisk,
        slot: VDiskPageSlot,
        component: VDiskPage,
    },
    {
        path: routes.tablet,
        slot: TabletSlot,
        component: Tablet,
    },
    {
        path: routes.tabletsFilters,
        slot: TabletsFiltersSlot,
        component: TabletsFilters,
    },
];

function renderRouteSlot(slots: SlotMap, route: RouteSlot) {
    return (
        <Route
            key={route.path}
            path={route.path}
            exact={route.exact}
            render={(props) => {
                const slot = slots.get(route.slot);
                let content;
                if (!slot) {
                    const Component = route.component;
                    content = <Component {...props} />;
                } else if (typeof slot.rendered === 'function') {
                    content = slot.rendered({component: route.component, ...props});
                } else {
                    content = slot.rendered;
                }
                return <main className={b('main')}>{content}</main>;
            }}
        />
    );
}

interface ContentProps {
    singleClusterMode: boolean;
    children: React.ReactNode;
}
export function Content(props: ContentProps) {
    const {singleClusterMode} = props;

    const slots = useSlots(props);

    const additionalRoutes = slots.get(RoutesSlot);

    const redirect = slots.get(RedirectSlot);
    const redirectProps: RedirectProps =
        redirect?.props ?? (singleClusterMode ? {to: getClusterPath()} : {to: routes.clusters});

    let mainPage: RawBreadcrumbItem | undefined;
    if (!singleClusterMode) {
        mainPage = {text: i18n('pages.clusters'), link: routes.clusters};
    }

    return (
        <Switch>
            {singleClusterMode
                ? null
                : renderRouteSlot(slots, {
                      path: routes.clusters,
                      exact: true,
                      component: Clusters,
                      slot: ClustersSlot,
                  })}
            {additionalRoutes?.rendered}
            {/* Single cluster routes */}
            <Route key="single-cluster">
                <ClusterNodesMapContextProvider>
                    <GetUser />
                    <Header mainPage={mainPage} />
                    <Switch>
                        {routesSlots.map((route) => {
                            return renderRouteSlot(slots, route);
                        })}
                        <Redirect {...redirectProps} />
                    </Switch>
                </ClusterNodesMapContextProvider>
            </Route>
        </Switch>
    );
}

function GetUser() {
    const dispatch = useTypedDispatch();
    const {isAuthenticated, isInternalUser} = useTypedSelector((state) => ({
        isAuthenticated: state.authentication.isAuthenticated,
        isInternalUser: Boolean(state.authentication.user),
    }));

    React.useEffect(() => {
        if (isAuthenticated && !isInternalUser) {
            dispatch(getUser());
        }
    }, [dispatch, isAuthenticated, isInternalUser]);

    return null;
}

interface ContentWrapperProps {
    singleClusterMode: boolean;
    isAuthenticated: boolean;
    children: React.ReactNode;
}

function ContentWrapper(props: ContentWrapperProps) {
    const {singleClusterMode, isAuthenticated} = props;

    return (
        <Switch>
            <Route path={routes.auth}>
                <Authentication closable />
            </Route>
            <Route>
                <div className={b({embedded: singleClusterMode})}>
                    {isAuthenticated ? props.children : <Authentication />}
                </div>
            </Route>
        </Switch>
    );
}

function mapStateToProps(state: RootState) {
    return {
        isAuthenticated: state.authentication.isAuthenticated,
        singleClusterMode: state.singleClusterMode,
    };
}

export default connect(mapStateToProps)(ContentWrapper);
