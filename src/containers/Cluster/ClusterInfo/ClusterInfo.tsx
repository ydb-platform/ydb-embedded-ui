import {useCallback, useEffect, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';
import block from 'bem-cn-lite';
import qs from 'qs';

import EntityStatus from '../../../components/EntityStatus/EntityStatus';
import ProgressViewer from '../../../components/ProgressViewer/ProgressViewer';
import InfoViewer, {InfoViewerItem} from '../../../components/InfoViewer/InfoViewer';
import {Tags} from '../../../components/Tags';
import {Tablet} from '../../../components/Tablet';
import {Loader} from '../../../components/Loader';
import {ResponseError} from '../../../components/Errors/ResponseError';
import {ExternalLinkWithIcon} from '../../../components/ExternalLinkWithIcon/ExternalLinkWithIcon';

import type {
    AdditionalClusterProps,
    AdditionalVersionsProps,
    ClusterLink,
} from '../../../types/additionalProps';
import type {VersionValue} from '../../../types/versions';
import type {TClusterInfo} from '../../../types/api/cluster';
import {getClusterNodes} from '../../../store/reducers/clusterNodes/clusterNodes';
import {getClusterInfo} from '../../../store/reducers/cluster/cluster';
import {backend, customBackend} from '../../../store';
import {setHeader} from '../../../store/reducers/header';
import {formatStorageValues} from '../../../utils';
import {useAutofetcher, useTypedSelector} from '../../../utils/hooks';
import {
    parseVersionsToVersionToColorMap,
    parseNodesToVersionsValues,
} from '../../../utils/versions';
import routes, {CLUSTER_PAGES, createHref} from '../../../routes';

import {Versions} from '../../Versions/Versions';
import {VersionsBar} from '../VersionsBar/VersionsBar';

import {compareTablets} from './utils';

import './ClusterInfo.scss';

const b = block('cluster-info');

const getInfo = (
    cluster: TClusterInfo = {},
    versionsValues: VersionValue[] = [],
    additionalInfo: InfoViewerItem[] = [],
    links: ClusterLink[] = [],
) => {
    const info: InfoViewerItem[] = [];

    if (cluster.DataCenters) {
        info.push({
            label: 'DC',
            value: <Tags tags={cluster.DataCenters} />,
        });
    }

    if (cluster.SystemTablets) {
        info.push({
            label: 'Tablets',
            value: (
                <div className={b('system-tablets')}>
                    {cluster.SystemTablets.sort(compareTablets).map((tablet, tabletIndex) => (
                        <Tablet key={tabletIndex} tablet={tablet} />
                    ))}
                </div>
            ),
        });
    }

    info.push(
        {
            label: 'Nodes',
            value: (
                <ProgressViewer
                    className={b('metric-field')}
                    value={cluster?.NodesAlive}
                    capacity={cluster?.NodesTotal}
                />
            ),
        },
        {
            label: 'Load',
            value: (
                <ProgressViewer
                    className={b('metric-field')}
                    value={cluster?.LoadAverage}
                    capacity={cluster?.NumberOfCpus}
                />
            ),
        },
        {
            label: 'Storage',
            value: (
                <ProgressViewer
                    className={b('metric-field')}
                    value={cluster?.StorageUsed}
                    capacity={cluster?.StorageTotal}
                    formatValues={formatStorageValues}
                />
            ),
        },
        ...additionalInfo,
        {
            label: 'Links',
            value: (
                <div className={b('links')}>
                    {links.map(({title, url}) => (
                        <ExternalLinkWithIcon key={title} title={title} url={url} />
                    ))}
                </div>
            ),
        },
        {
            label: 'Versions',
            value: <VersionsBar versionsValues={versionsValues} />,
        },
    );

    return info;
};

interface ClusterInfoProps {
    clusterTitle?: string;
    additionalClusterProps?: AdditionalClusterProps;
    additionalVersionsProps?: AdditionalVersionsProps;
}

export const ClusterInfo = ({
    clusterTitle,
    additionalClusterProps = {},
    additionalVersionsProps = {},
}: ClusterInfoProps) => {
    const dispatch = useDispatch();
    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
    const {clusterName} = queryParams;

    const {data: cluster, loading, wasLoaded, error} = useTypedSelector((state) => state.cluster);
    const {
        nodes,
        loading: nodesLoading,
        wasLoaded: nodesWasLoaded,
        error: nodesError,
    } = useTypedSelector((state) => state.clusterNodes);
    const singleClusterMode = useTypedSelector((state) => state.singleClusterMode);

    useEffect(() => {
        dispatch(
            setHeader([
                {
                    text: CLUSTER_PAGES.cluster.title,
                    link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.cluster.id}),
                },
            ]),
        );
    }, [dispatch]);

    const fetchData = useCallback(() => {
        dispatch(getClusterInfo(clusterName ? String(clusterName) : undefined));
        dispatch(getClusterNodes());
    }, [dispatch, clusterName]);

    useAutofetcher(fetchData, [fetchData], true);

    const versionToColor = useMemo(() => {
        if (additionalVersionsProps?.getVersionToColorMap) {
            return additionalVersionsProps.getVersionToColorMap();
        }
        return parseVersionsToVersionToColorMap(cluster?.Versions);
    }, [additionalVersionsProps, cluster]);

    const versionsValues = useMemo(() => {
        return parseNodesToVersionsValues(nodes, versionToColor);
    }, [nodes, versionToColor]);

    if ((loading && !wasLoaded) || (nodesLoading && !nodesWasLoaded)) {
        return <Loader size="l" />;
    }

    if (error || nodesError) {
        return <ResponseError error={error || nodesError} />;
    }

    let internalLink = backend + '/internal';

    if (singleClusterMode && !customBackend) {
        internalLink = `/internal`;
    }

    const {info = [], links = []} = additionalClusterProps;

    const clusterInfo = getInfo(cluster, versionsValues, info, [
        {title: 'Internal Viewer', url: internalLink},
        ...links,
    ]);

    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className={b('title')}>
                    <EntityStatus
                        size="m"
                        status={cluster?.Overall}
                        name={clusterTitle ?? cluster?.Name ?? 'Unknown cluster'}
                    />
                </div>
                <InfoViewer dots={true} info={clusterInfo} />
            </div>

            <Versions nodes={nodes} versionToColor={versionToColor} />
        </div>
    );
};
