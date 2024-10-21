import React from 'react';

import {Skeleton, Tabs} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';
import {Redirect, Route, Switch, useRouteMatch} from 'react-router-dom';
import {StringParam, useQueryParams} from 'use-query-params';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {EntityStatus} from '../../components/EntityStatus/EntityStatus';
import {InternalLink} from '../../components/InternalLink';
import routes, {getLocationObjectFromHref} from '../../routes';
import {
    clusterApi,
    selectClusterTabletsWithFqdn,
    selectClusterTitle,
    updateDefaultClusterTab,
} from '../../store/reducers/cluster/cluster';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import type {
    AdditionalClusterProps,
    AdditionalNodesProps,
    AdditionalTenantsProps,
    AdditionalVersionsProps,
} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {parseVersionsToVersionToColorMap} from '../../utils/versions';
import {NodesWrapper} from '../Nodes/NodesWrapper';
import {StorageWrapper} from '../Storage/StorageWrapper';
import {TabletsTable} from '../Tablets/TabletsTable';
import {Tenants} from '../Tenants/Tenants';
import {Versions} from '../Versions/Versions';

import {ClusterDashboard} from './ClusterDashboard/ClusterDashboard';
import {ClusterInfo} from './ClusterInfo/ClusterInfo';
import type {ClusterTab} from './utils';
import {clusterTabs, clusterTabsIds, getClusterPath, isClusterTab} from './utils';

import './Cluster.scss';

const b = cn('ydb-cluster');

interface ClusterProps {
    additionalTenantsProps?: AdditionalTenantsProps;
    additionalNodesProps?: AdditionalNodesProps;
    additionalClusterProps?: AdditionalClusterProps;
    additionalVersionsProps?: AdditionalVersionsProps;
}

export function Cluster({
    additionalClusterProps,
    additionalTenantsProps,
    additionalNodesProps,
    additionalVersionsProps,
}: ClusterProps) {
    const container = React.useRef<HTMLDivElement>(null);

    const dispatch = useTypedDispatch();

    const activeTabId = useClusterTab();

    const [{clusterName, backend}] = useQueryParams({
        clusterName: StringParam,
        backend: StringParam,
    });

    const clusterTitle = useTypedSelector((state) =>
        selectClusterTitle(state, clusterName ?? undefined),
    );

    const {
        data: {clusterData: cluster = {}, groupsStats} = {},
        isLoading: infoLoading,
        error,
    } = clusterApi.useGetClusterInfoQuery(clusterName ?? undefined);

    const clusterError = error && typeof error === 'object' ? error : undefined;

    const clusterTablets = useTypedSelector((state) =>
        selectClusterTabletsWithFqdn(state, clusterName ?? undefined),
    );

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('cluster', {}));
    }, [dispatch]);

    const versionToColor = React.useMemo(() => {
        if (additionalVersionsProps?.getVersionToColorMap) {
            return additionalVersionsProps?.getVersionToColorMap();
        }
        return parseVersionsToVersionToColorMap(cluster?.Versions);
    }, [additionalVersionsProps, cluster]);

    const getClusterTitle = () => {
        if (infoLoading) {
            return <Skeleton className={b('title-skeleton')} />;
        }

        return (
            <EntityStatus
                size="m"
                status={cluster?.Overall}
                name={clusterTitle}
                className={b('title')}
            />
        );
    };

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
            <div className={b('sticky-wrapper')}>
                <AutoRefreshControl className={b('auto-refresh-control')} />
            </div>
            <ClusterDashboard cluster={cluster} groupStats={groupsStats} loading={infoLoading} />
            <div className={b('tabs-sticky-wrapper')}>
                <Tabs
                    size="l"
                    allowNotSelected={true}
                    activeTab={activeTabId}
                    items={clusterTabs}
                    wrapTo={({id}, node) => {
                        const path = getClusterPath(id as ClusterTab, {clusterName, backend});
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
            <Switch>
                <Route
                    path={
                        getLocationObjectFromHref(getClusterPath(clusterTabsIds.overview)).pathname
                    }
                >
                    <ClusterInfo
                        cluster={cluster}
                        versionToColor={versionToColor}
                        loading={infoLoading}
                        error={clusterError}
                        additionalClusterProps={additionalClusterProps}
                    />
                </Route>
                <Route
                    path={
                        getLocationObjectFromHref(getClusterPath(clusterTabsIds.tablets)).pathname
                    }
                >
                    <div className={b('tablets')}>
                        <div className={b('fake-block')} />
                        <TabletsTable
                            loading={infoLoading}
                            tablets={clusterTablets}
                            className={b('tablets-table')}
                        />
                    </div>
                </Route>
                <Route
                    path={
                        getLocationObjectFromHref(getClusterPath(clusterTabsIds.tenants)).pathname
                    }
                >
                    <Tenants additionalTenantsProps={additionalTenantsProps} />
                </Route>
                <Route
                    path={getLocationObjectFromHref(getClusterPath(clusterTabsIds.nodes)).pathname}
                >
                    <NodesWrapper
                        parentRef={container}
                        additionalNodesProps={additionalNodesProps}
                    />
                </Route>
                <Route
                    path={
                        getLocationObjectFromHref(getClusterPath(clusterTabsIds.storage)).pathname
                    }
                >
                    <StorageWrapper parentRef={container} />
                </Route>
                <Route
                    path={
                        getLocationObjectFromHref(getClusterPath(clusterTabsIds.versions)).pathname
                    }
                >
                    <Versions versionToColor={versionToColor} cluster={cluster} />
                </Route>
                <Route
                    render={() => (
                        <Redirect to={getLocationObjectFromHref(getClusterPath(activeTabId))} />
                    )}
                />
            </Switch>
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
