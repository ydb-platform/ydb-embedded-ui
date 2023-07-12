import {useEffect, useMemo} from 'react';
import {useLocation, useRouteMatch} from 'react-router';
import {useDispatch} from 'react-redux';
import cn from 'bem-cn-lite';
import qs from 'qs';

import {Tabs} from '@gravity-ui/uikit';

import type {
    AdditionalClusterProps,
    AdditionalTenantsProps,
    AdditionalVersionsProps,
} from '../../types/additionalProps';
import type {AdditionalNodesInfo} from '../../utils/nodes';
import routes from '../../routes';

import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {getClusterInfo} from '../../store/reducers/cluster/cluster';
import {getClusterNodes} from '../../store/reducers/clusterNodes/clusterNodes';
import {parseNodesToVersionsValues, parseVersionsToVersionToColorMap} from '../../utils/versions';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';

import {InternalLink} from '../../components/InternalLink';
import {Tenants} from '../Tenants/Tenants';
import {Nodes} from '../Nodes/Nodes';
import {Storage} from '../Storage/Storage';
import {Versions} from '../Versions/Versions';

import {ClusterInfo} from './ClusterInfo/ClusterInfo';
import {ClusterTab, clusterTabs, clusterTabsIds, getClusterPath} from './utils';

import './Cluster.scss';

const b = cn('cluster');

interface ClusterProps {
    additionalTenantsProps?: AdditionalTenantsProps;
    additionalNodesInfo?: AdditionalNodesInfo;
    additionalClusterProps?: AdditionalClusterProps;
    additionalVersionsProps?: AdditionalVersionsProps;
}

function Cluster({
    additionalClusterProps,
    additionalTenantsProps,
    additionalNodesInfo,
    additionalVersionsProps,
}: ClusterProps) {
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
            case clusterTabsIds.tenants: {
                return <Tenants additionalTenantsProps={additionalTenantsProps} />;
            }
            case clusterTabsIds.nodes: {
                return <Nodes additionalNodesInfo={additionalNodesInfo} />;
            }
            case clusterTabsIds.storage: {
                return <Storage additionalNodesInfo={additionalNodesInfo} />;
            }
            case clusterTabsIds.versions: {
                return <Versions versionToColor={versionToColor} />;
            }
            default: {
                return null;
            }
        }
    };

    const getTabEntityCount = (tabId: ClusterTab) => {
        switch (tabId) {
            case clusterTabsIds.tenants: {
                return cluster?.Tenants ? Number(cluster.Tenants) : undefined;
            }
            case clusterTabsIds.nodes: {
                return cluster?.NodesTotal ? Number(cluster.NodesTotal) : undefined;
            }
            default: {
                return undefined;
            }
        }
    };

    return (
        <div className={b()}>
            <ClusterInfo
                cluster={cluster}
                versionsValues={versionsValues}
                loading={infoLoading}
                error={clusterError}
                additionalClusterProps={additionalClusterProps}
            />

            <div className={b('tabs')}>
                <Tabs
                    size="l"
                    allowNotSelected={true}
                    activeTab={activeTab as string}
                    items={clusterTabs.map((item) => {
                        return {
                            ...item,
                            counter: getTabEntityCount(item.id),
                        };
                    })}
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
