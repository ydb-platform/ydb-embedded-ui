import React from 'react';

import {Skeleton, Tab, TabList, TabProvider} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {Redirect, Route, Switch, useRouteMatch} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {EntityStatus} from '../../components/EntityStatusNew/EntityStatus';
import {EFlagToDescription} from '../../components/EntityStatusNew/utils';
import {InternalLink} from '../../components/InternalLink';
import {NetworkTable} from '../../components/NetworkTable/NetworkTable';
import {useShouldShowClusterNetworkTable} from '../../components/NetworkTable/hooks';
import routes, {getLocationObjectFromHref} from '../../routes';
import {useClusterDashboardAvailable} from '../../store/reducers/capabilities/hooks';
import {
    INITIAL_DEFAULT_CLUSTER_TAB,
    clusterApi,
    selectClusterTabletsWithFqdn,
    selectClusterTitle,
    updateDefaultClusterTab,
    useClusterBaseInfo,
} from '../../store/reducers/cluster/cluster';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import type {
    AdditionalClusterProps,
    AdditionalNodesProps,
    AdditionalTenantsProps,
} from '../../types/additionalProps';
import {EFlag} from '../../types/api/enums';
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useAppTitle} from '../App/AppTitleContext';
import {Nodes} from '../Nodes/Nodes';
import {PaginatedStorage} from '../Storage/PaginatedStorage';
import {TabletsTable} from '../Tablets/TabletsTable';
import {Tenants} from '../Tenants/Tenants';
import {VersionsContainer} from '../Versions/Versions';

import {ClusterOverview} from './ClusterOverview/ClusterOverview';
import type {ClusterTab} from './utils';
import {
    clusterTabs,
    clusterTabsIds,
    getClusterPath,
    isClusterTab,
    useShouldShowEventsTab,
} from './utils';

import './Cluster.scss';

const b = cn('ydb-cluster');

interface ClusterProps {
    additionalTenantsProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
    additionalClusterProps?: AdditionalClusterProps;
}

export function Cluster({
    additionalClusterProps,
    additionalTenantsProps,
    additionalNodesProps,
}: ClusterProps) {
    const container = React.useRef<HTMLDivElement>(null);
    const isClusterDashboardAvailable = useClusterDashboardAvailable();

    const shouldShowNetworkTable = useShouldShowClusterNetworkTable();
    const shouldShowEventsTab = useShouldShowEventsTab();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const dispatch = useTypedDispatch();

    const activeTabId = useClusterTab();

    const [{clusterName, backend}] = useQueryParams({
        clusterName: StringParam,
        backend: StringParam,
    });

    const viewerClusterTitle = useTypedSelector((state) =>
        selectClusterTitle(state, clusterName ?? undefined),
    );

    const {title: metaClusterTitle} = useClusterBaseInfo();

    const clusterTitle = metaClusterTitle ?? viewerClusterTitle;

    const {
        data: {clusterData: cluster, groupsStats} = {},
        isLoading: infoLoading,
        error,
    } = clusterApi.useGetClusterInfoQuery(clusterName ?? undefined, {
        pollingInterval: autoRefreshInterval,
    });

    const clusterError = error && typeof error === 'object' ? error : undefined;

    const clusterTablets = useTypedSelector((state) =>
        selectClusterTabletsWithFqdn(state, clusterName ?? undefined),
    );

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('cluster', {}));
    }, [dispatch]);

    const actualClusterTabs = React.useMemo(() => {
        let tabs = clusterTabs;

        if (!shouldShowNetworkTable) {
            tabs = tabs.filter((tab) => tab.id !== clusterTabsIds.network);
        }
        if (!shouldShowEventsTab) {
            tabs = tabs.filter((tab) => tab.id !== clusterTabsIds.events);
        }

        return tabs;
    }, [shouldShowEventsTab, shouldShowNetworkTable]);

    const getClusterTitle = () => {
        if (infoLoading) {
            return <Skeleton className={b('title-skeleton')} />;
        }
        const clusterStatus = cluster?.Overall || EFlag.Grey;

        return (
            <EntityStatus className={b('title')}>
                {clusterTitle}
                <EntityStatus.Label
                    status={clusterStatus}
                    note={EFlagToDescription[clusterStatus]}
                />
            </EntityStatus>
        );
    };

    const activeTab = React.useMemo(
        () => actualClusterTabs.find(({id}) => id === activeTabId),
        [activeTabId, actualClusterTabs],
    );

    const {appTitle} = useAppTitle();

    return (
        <div className={b()} ref={container}>
            <Helmet
                defaultTitle={`${clusterTitle} — ${appTitle}`}
                titleTemplate={`%s — ${clusterTitle} — ${appTitle}`}
            >
                {activeTab ? <title>{activeTab.title}</title> : null}
            </Helmet>
            <div className={b('header')}>{getClusterTitle()}</div>
            <div className={b('sticky-wrapper')}>
                <AutoRefreshControl className={b('auto-refresh-control')} />
            </div>
            {isClusterDashboardAvailable && (
                <div className={b('dashboard')}>
                    <ClusterOverview
                        cluster={cluster ?? {}}
                        groupStats={groupsStats}
                        loading={infoLoading}
                        error={clusterError || cluster?.error}
                        additionalClusterProps={additionalClusterProps}
                    />
                </div>
            )}
            <div className={b('tabs-sticky-wrapper')}>
                <TabProvider value={activeTabId}>
                    <TabList size="l">
                        {actualClusterTabs.map(({id, title}) => {
                            const path = getClusterPath(id as ClusterTab, {clusterName, backend});
                            return (
                                <Tab key={id} value={id}>
                                    <InternalLink
                                        view="primary"
                                        as="tab"
                                        to={path}
                                        onClick={() => {
                                            dispatch(updateDefaultClusterTab(id));
                                        }}
                                    >
                                        {title}
                                    </InternalLink>
                                </Tab>
                            );
                        })}
                    </TabList>
                </TabProvider>
            </div>
            <div className={b('content')}>
                <Switch>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.tablets))
                                .pathname
                        }
                    >
                        <TabletsTable
                            loading={infoLoading}
                            tablets={clusterTablets}
                            scrollContainerRef={container}
                        />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.tenants))
                                .pathname
                        }
                    >
                        <Tenants
                            additionalTenantsProps={additionalTenantsProps}
                            scrollContainerRef={container}
                        />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.nodes)).pathname
                        }
                    >
                        <Nodes
                            scrollContainerRef={container}
                            additionalNodesProps={additionalNodesProps}
                        />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.storage))
                                .pathname
                        }
                    >
                        <PaginatedStorage scrollContainerRef={container} />
                    </Route>
                    {shouldShowNetworkTable && (
                        <Route
                            path={
                                getLocationObjectFromHref(getClusterPath(clusterTabsIds.network))
                                    .pathname
                            }
                        >
                            <NetworkTable
                                scrollContainerRef={container}
                                additionalNodesProps={additionalNodesProps}
                            />
                        </Route>
                    )}
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.versions))
                                .pathname
                        }
                    >
                        <VersionsContainer cluster={cluster} loading={infoLoading} />
                    </Route>
                    {shouldShowEventsTab && (
                        <Route
                            path={
                                getLocationObjectFromHref(getClusterPath(clusterTabsIds.events))
                                    .pathname
                            }
                        >
                            {uiFactory.renderEvents?.()}
                        </Route>
                    )}

                    <Route
                        render={() => (
                            <Redirect to={getLocationObjectFromHref(getClusterPath(activeTabId))} />
                        )}
                    />
                </Switch>
            </div>
        </div>
    );
}

function useClusterTab() {
    const dispatch = useTypedDispatch();

    const defaultTab = useTypedSelector((state) => state.cluster.defaultClusterTab);

    const shouldShowNetworkTable = useShouldShowClusterNetworkTable();
    const shouldShowEventsTab = useShouldShowEventsTab();

    const match = useRouteMatch<{activeTab: string}>(routes.cluster);

    const {activeTab: activeTabFromParams} = match?.params || {};
    let activeTab: ClusterTab;

    const shouldSwitchFromNetworkToDefault =
        !shouldShowNetworkTable && activeTabFromParams === clusterTabsIds.network;
    const shouldSwitchFromEventsToDefault =
        !shouldShowEventsTab && activeTabFromParams === clusterTabsIds.events;

    if (shouldSwitchFromNetworkToDefault || shouldSwitchFromEventsToDefault) {
        activeTab = INITIAL_DEFAULT_CLUSTER_TAB;
    } else if (isClusterTab(activeTabFromParams)) {
        activeTab = activeTabFromParams;
    } else {
        activeTab = defaultTab;
    }

    React.useEffect(() => {
        if (activeTab !== defaultTab) {
            dispatch(updateDefaultClusterTab(activeTab));
        }
    }, [activeTab, defaultTab, dispatch]);

    return activeTab;
}
