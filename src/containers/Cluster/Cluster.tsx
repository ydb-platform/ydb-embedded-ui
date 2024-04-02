import React from 'react';

import {Skeleton, Tabs} from '@gravity-ui/uikit';
import qs from 'qs';
import {Helmet} from 'react-helmet-async';
import {Redirect, Route, Switch, useLocation, useRouteMatch} from 'react-router';

import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../components/InternalLink';
import routes, {getLocationObjectFromHref} from '../../routes';
import {getClusterInfo, updateDefaultClusterTab} from '../../store/reducers/cluster/cluster';
import {getClusterNodes} from '../../store/reducers/clusterNodes/clusterNodes';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import type {
    AdditionalClusterProps,
    AdditionalNodesProps,
    AdditionalTenantsProps,
    AdditionalVersionsProps,
} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {CLUSTER_DEFAULT_TITLE} from '../../utils/constants';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {parseNodesToVersionsValues, parseVersionsToVersionToColorMap} from '../../utils/versions';
import {NodesWrapper} from '../Nodes/NodesWrapper';
import {StorageWrapper} from '../Storage/StorageWrapper';
import {Tenants} from '../Tenants/Tenants';
import {Versions} from '../Versions/Versions';

import {ClusterInfo} from './ClusterInfo/ClusterInfo';
import type {ClusterTab} from './utils';
import {clusterTabs, clusterTabsIds, getClusterPath, isClusterTab} from './utils';

import './Cluster.scss';

const b = cn('cluster');

interface ClusterProps {
    additionalTenantsProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
    additionalClusterProps?: AdditionalClusterProps;
    additionalVersionsProps?: AdditionalVersionsProps;
}

function Cluster({
    additionalClusterProps,
    additionalTenantsProps,
    additionalNodesProps,
    additionalVersionsProps,
}: ClusterProps) {
    const container = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();

    const activeTabId = useClusterTab();

    const location = useLocation();
    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
    const {clusterName} = queryParams;

    const {
        data: cluster = {},
        loading: clusterLoading,
        wasLoaded: clusterWasLoaded,
        error: clusterError,
        groupsStats,
    } = useTypedSelector((state) => state.cluster);
    const {
        nodes,
        loading: nodesLoading,
        wasLoaded: nodesWasLoaded,
    } = useTypedSelector((state) => state.clusterNodes);

    const {Name} = cluster;

    const infoLoading = (clusterLoading && !clusterWasLoaded) || (nodesLoading && !nodesWasLoaded);

    React.useEffect(() => {
        dispatch(getClusterNodes());
    }, [dispatch]);

    useAutofetcher(
        () => dispatch(getClusterInfo(clusterName ? String(clusterName) : undefined)),
        [dispatch, clusterName],
        true,
    );

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('cluster', {}));
    }, [dispatch, Name]);

    const versionToColor = React.useMemo(() => {
        if (additionalVersionsProps?.getVersionToColorMap) {
            return additionalVersionsProps?.getVersionToColorMap();
        }
        return parseVersionsToVersionToColorMap(cluster?.Versions);
    }, [additionalVersionsProps, cluster]);

    const versionsValues = React.useMemo(() => {
        return parseNodesToVersionsValues(nodes, versionToColor);
    }, [nodes, versionToColor]);

    const getClusterTitle = () => {
        if (infoLoading) {
            return <Skeleton className={b('title-skeleton')} />;
        }

        return (
            <EntityStatus
                size="m"
                status={cluster?.Overall}
                name={cluster?.Name ?? CLUSTER_DEFAULT_TITLE}
                className={b('title')}
            />
        );
    };

    const clusterTitle = cluster?.Name ?? clusterName ?? CLUSTER_DEFAULT_TITLE;
    const activeTab = React.useMemo(
        () => clusterTabs.find(({id}) => id === activeTabId),
        [activeTabId],
    );

    return (
        <div className={b()} ref={container}>
            <Helmet
                defaultTitle={`${clusterTitle} — YDB Monitoring`}
                titleTemplate={`%s — ${clusterTitle} — YDB Monitoring`}
            >
                {activeTab ? <title>{activeTab.title}</title> : null}
            </Helmet>
            <div className={b('header')}>{getClusterTitle()}</div>
            <div className={b('tabs')}>
                <Tabs
                    size="l"
                    allowNotSelected={true}
                    activeTab={activeTabId}
                    items={clusterTabs}
                    wrapTo={({id}, node) => {
                        const path = getClusterPath(id as ClusterTab, queryParams);
                        return (
                            <InternalLink
                                to={path}
                                key={id}
                                onClick={() => {
                                    dispatch(updateDefaultClusterTab(id));
                                }}
                            >
                                {node}
                            </InternalLink>
                        );
                    }}
                />
            </div>

            <div>
                <Switch>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.overview))
                                .pathname
                        }
                    >
                        <ClusterInfo
                            cluster={cluster}
                            groupsStats={groupsStats}
                            versionsValues={versionsValues}
                            loading={infoLoading}
                            error={clusterError}
                            additionalClusterProps={additionalClusterProps}
                        />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.tenants))
                                .pathname
                        }
                    >
                        <Tenants additionalTenantsProps={additionalTenantsProps} />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.nodes)).pathname
                        }
                    >
                        <NodesWrapper
                            parentContainer={container.current}
                            additionalNodesProps={additionalNodesProps}
                        />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.storage))
                                .pathname
                        }
                    >
                        <StorageWrapper
                            parentContainer={container.current}
                            additionalNodesProps={additionalNodesProps}
                        />
                    </Route>
                    <Route
                        path={
                            getLocationObjectFromHref(getClusterPath(clusterTabsIds.versions))
                                .pathname
                        }
                    >
                        <Versions versionToColor={versionToColor} />
                    </Route>
                    <Redirect to={getLocationObjectFromHref(getClusterPath(activeTabId))} />
                </Switch>
            </div>
        </div>
    );
}

function useClusterTab() {
    const dispatch = useTypedDispatch();

    const defaultTab = useTypedSelector((state) => state.cluster.defaultClusterTab);

    const match = useRouteMatch<{activeTab: string}>(routes.cluster);

    const {activeTab: activeTabFromParams} = match?.params || {};
    let activeTab: ClusterTab;
    if (isClusterTab(activeTabFromParams)) {
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

export default Cluster;
