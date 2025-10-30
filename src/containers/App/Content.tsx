import React from 'react';

import {connect} from 'react-redux';
import type {RedirectProps} from 'react-router-dom';
import {Redirect, Route, Switch} from 'react-router-dom';

import {AccessDenied} from '../../components/Errors/403';
import {PageError} from '../../components/Errors/PageError/PageError';
import {LoaderWrapper} from '../../components/LoaderWrapper/LoaderWrapper';
import {useSlots} from '../../components/slots';
import type {SlotMap} from '../../components/slots/SlotMap';
import type {SlotComponent} from '../../components/slots/types';
import routes, {getClusterPath} from '../../routes';
import type {RootState} from '../../store';
import {authenticationApi} from '../../store/reducers/authentication/authentication';
import {
    useCapabilitiesQuery,
    useClusterWithoutAuthInUI,
    useMetaCapabilitiesLoaded,
    useMetaCapabilitiesQuery,
} from '../../store/reducers/capabilities/hooks';
import {nodesListApi} from '../../store/reducers/nodesList';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {useDatabaseFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {useMetaAuth, useMetaAuthUnavailable} from '../../utils/hooks/useMetaAuth';
import {lazyComponent} from '../../utils/lazyComponent';
import {isAccessError, isRedirectToAuth} from '../../utils/response';
import Authentication from '../Authentication/Authentication';
import Header from '../Header/Header';

import {useAppTitle} from './AppTitleContext';
import {
    ClusterSlot,
    ClustersSlot,
    NodeSlot,
    PDiskPageSlot,
    RedirectSlot,
    RoutesSlot,
    StorageGroupSlot,
    TabletSlot,
    TenantSlot,
    VDiskPageSlot,
} from './appSlots';

import './App.scss';

const b = cn('app');

type RouteSlot = {
    path: string;
    slot: SlotComponent<any>;
    component: React.ComponentType<any>;
    wrapper?: React.ComponentType<any>;
    exact?: boolean;
};
const routesSlots: RouteSlot[] = [
    {
        path: routes.cluster,
        slot: ClusterSlot,
        component: lazyComponent(() => import('../Cluster/Cluster'), 'Cluster'),
        wrapper: DataWrapper,
    },
    {
        path: routes.tenant,
        slot: TenantSlot,
        component: lazyComponent(() => import('../Tenant/Tenant'), 'Tenant'),
        wrapper: DataWrapper,
    },
    {
        path: routes.node,
        slot: NodeSlot,
        component: lazyComponent(() => import('../Node/Node'), 'Node'),
        wrapper: DataWrapper,
    },
    {
        path: routes.pDisk,
        slot: PDiskPageSlot,
        component: lazyComponent(() => import('../PDiskPage/PDiskPage'), 'PDiskPage'),
        wrapper: DataWrapper,
    },
    {
        path: routes.vDisk,
        slot: VDiskPageSlot,
        component: lazyComponent(() => import('../VDiskPage/VDiskPage'), 'VDiskPage'),
        wrapper: DataWrapper,
    },
    {
        path: routes.storageGroup,
        slot: StorageGroupSlot,
        component: lazyComponent(
            () => import('../StorageGroupPage/StorageGroupPage'),
            'StorageGroupPage',
        ),
        wrapper: DataWrapper,
    },
    {
        path: routes.tablet,
        slot: TabletSlot,
        component: lazyComponent(() => import('../Tablet'), 'Tablet'),
        wrapper: DataWrapper,
    },
];

const Clusters = lazyComponent(() => import('../Clusters/Clusters'), 'Clusters');

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
                const Wrapper = route.wrapper ?? React.Fragment;
                return (
                    <main className={b('main')}>
                        <Wrapper>{content}</Wrapper>
                    </main>
                );
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

    return (
        <Switch>
            {additionalRoutes?.rendered}
            <Route>
                <Header />
                <Switch>
                    {singleClusterMode
                        ? null
                        : renderRouteSlot(slots, {
                              path: routes.clusters,
                              exact: true,
                              component: Clusters,
                              slot: ClustersSlot,
                              wrapper: ClustersDataWrapper,
                          })}
                    {/* Single cluster routes */}
                    {routesSlots.map((route) => {
                        return renderRouteSlot(slots, route);
                    })}
                    <Route
                        path={redirectProps.from || redirectProps.path}
                        exact={redirectProps.exact}
                        strict={redirectProps.strict}
                        render={() => <Redirect to={redirectProps.to} push={redirectProps.push} />}
                    />
                </Switch>
            </Route>
        </Switch>
    );
}

function DataWrapper({children}: {children: React.ReactNode}) {
    return (
        // capabilities is going to work without authentication, but not all running systems are supporting this yet
        <GetCapabilities>
            <GetUser>
                <GetNodesList />
                {/* this GetCapabilities will be removed */}
                <GetCapabilities>{children}</GetCapabilities>
            </GetUser>
        </GetCapabilities>
    );
}

function ClustersDataWrapper({children}: {children: React.ReactNode}) {
    return (
        <GetMetaCapabilities>
            <GetMetaUser>{children}</GetMetaUser>
        </GetMetaCapabilities>
    );
}

function GetMetaUser({children}: {children: React.ReactNode}) {
    const metaAuth = useMetaAuth();

    if (metaAuth) {
        return <GetUser useMeta>{children}</GetUser>;
    }
    return children;
}

function GetUser({children, useMeta}: {children: React.ReactNode; useMeta?: boolean}) {
    const database = useDatabaseFromQuery();

    const {isFetching, error} = authenticationApi.useWhoamiQuery({
        database,
        useMeta,
    });
    const {appTitle} = useAppTitle();

    const errorProps = error ? {...uiFactory.clusterOrDatabaseAccessError} : undefined;

    return (
        <LoaderWrapper loading={isFetching} size="l" delay={0}>
            <PageError error={error} {...errorProps} errorPageTitle={appTitle}>
                {children}
            </PageError>
        </LoaderWrapper>
    );
}

function GetNodesList() {
    const database = useDatabaseFromQuery();
    nodesListApi.useGetNodesListQuery({database}, undefined);
    return null;
}

function GetCapabilities({children}: {children: React.ReactNode}) {
    const {data, error} = useCapabilitiesQuery();

    useMetaCapabilitiesQuery();
    // It is always true if there is no meta, since request finishes with an error
    const metaCapabilitiesLoaded = useMetaCapabilitiesLoaded();

    //do nothing, authentication is in progress upon redirect
    if (isRedirectToAuth(error)) {
        return null;
    }

    if (isAccessError(error)) {
        return <AccessDenied />;
    }

    const capabilitiesLoaded = Boolean(data || error);

    return (
        <LoaderWrapper loading={!capabilitiesLoaded || !metaCapabilitiesLoaded} size="l">
            {children}
        </LoaderWrapper>
    );
}

// Only for Clusters page, there is no need to request cluster capabilities there (GetCapabilities)
// This wrapper is not used in GetCapabilities so the page does not wait for 2 consecutive capabilities requests
function GetMetaCapabilities({children}: {children: React.ReactNode}) {
    useMetaCapabilitiesQuery();
    // It is always true if there is no meta, since request finishes with an error
    const metaCapabilitiesLoaded = useMetaCapabilitiesLoaded();

    return (
        <LoaderWrapper loading={!metaCapabilitiesLoaded} size="l">
            {children}
        </LoaderWrapper>
    );
}

interface ContentWrapperProps {
    singleClusterMode: boolean;
    isAuthenticated: boolean;
    children: React.ReactNode;
}

function ContentWrapper(props: ContentWrapperProps) {
    const {singleClusterMode, isAuthenticated} = props;
    const authUnavailable = useClusterWithoutAuthInUI();

    const metaAuthUnavailable = useMetaAuthUnavailable();

    const renderNotAuthenticated = () => {
        if (authUnavailable || metaAuthUnavailable) {
            return <AccessDenied />;
        }
        return <Authentication />;
    };

    return (
        <Switch>
            {!authUnavailable && !metaAuthUnavailable && (
                <Route path={routes.auth}>
                    <Authentication closable />
                </Route>
            )}
            <Route>
                <div className={b({embedded: singleClusterMode})}>
                    {isAuthenticated ? props.children : renderNotAuthenticated()}
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
