import {useEffect, useMemo, useRef} from 'react';
import {useLocation, useRouteMatch} from 'react-router';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';
import qs from 'qs';

import {Skeleton, Tabs} from '@gravity-ui/uikit';

import type {
    AdditionalClusterProps,
    AdditionalTenantsProps,
    AdditionalVersionsProps,
    AdditionalNodesProps,
} from '../../types/additionalProps';
import routes from '../../routes';

import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {getClusterInfo} from '../../store/reducers/cluster/cluster';
import {getClusterNodes} from '../../store/reducers/clusterNodes/clusterNodes';
import {parseNodesToVersionsValues, parseVersionsToVersionToColorMap} from '../../utils/versions';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';

import {InternalLink} from '../../components/InternalLink';
import {Tenants} from '../Tenants/Tenants';
import {StorageWrapper} from '../Storage/StorageWrapper';
import {NodesWrapper} from '../Nodes/NodesWrapper';
import {Versions} from '../Versions/Versions';
import EntityStatus from '../../components/EntityStatus/EntityStatus';
import {CLUSTER_DEFAULT_TITLE} from '../../utils/constants';

import {ClusterInfo} from './ClusterInfo/ClusterInfo';
import {ClusterTab, clusterTabs, clusterTabsIds, getClusterPath} from './utils';

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
    const container = useRef<HTMLDivElement>(null);

    const dispatch = useDispatch();

    const match = useRouteMatch<{activeTab: string}>(routes.cluster);
    const {activeTab = clusterTabsIds.tenants} = match?.params || {};

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

    useEffect(() => {
        dispatch(getClusterNodes());
    }, [dispatch]);

    useAutofetcher(
        () => dispatch(getClusterInfo(clusterName ? String(clusterName) : undefined)),
        [dispatch, clusterName],
        true,
    );

    useEffect(() => {
        dispatch(setHeaderBreadcrumbs('cluster', {}));
    }, [dispatch, Name]);

    const versionToColor = useMemo(() => {
        if (additionalVersionsProps?.getVersionToColorMap) {
            return additionalVersionsProps?.getVersionToColorMap();
        }
        return parseVersionsToVersionToColorMap(cluster?.Versions);
    }, [additionalVersionsProps, cluster]);

    const versionsValues = useMemo(() => {
        return parseNodesToVersionsValues(nodes, versionToColor);
    }, [nodes, versionToColor]);

    const renderTab = () => {
        switch (activeTab) {
            case clusterTabsIds.overview: {
                return (
                    <ClusterInfo
                        cluster={cluster}
                        groupsStats={groupsStats}
                        versionsValues={versionsValues}
                        loading={infoLoading}
                        error={clusterError}
                        additionalClusterProps={additionalClusterProps}
                    />
                );
            }
            case clusterTabsIds.tenants: {
                return <Tenants additionalTenantsProps={additionalTenantsProps} />;
            }
            case clusterTabsIds.nodes: {
                return (
                    <NodesWrapper
                        parentContainer={container.current}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
            case clusterTabsIds.storage: {
                return (
                    <StorageWrapper
                        parentContainer={container.current}
                        additionalNodesProps={additionalNodesProps}
                    />
                );
            }
            case clusterTabsIds.versions: {
                return <Versions versionToColor={versionToColor} />;
            }
            default: {
                return null;
            }
        }
    };
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

    return (
        <div className={b()} ref={container}>
            <div className={b('header')}>{getClusterTitle()}</div>
            <div className={b('tabs')}>
                <Tabs
                    size="l"
                    allowNotSelected={true}
                    activeTab={activeTab as string}
                    items={clusterTabs}
                    wrapTo={({id}, node) => {
                        const path = getClusterPath(id as ClusterTab, queryParams);
                        return (
                            <InternalLink to={path} key={id}>
                                {node}
                            </InternalLink>
                        );
                    }}
                />
            </div>

            <div>{renderTab()}</div>
        </div>
    );
}

export default Cluster;
