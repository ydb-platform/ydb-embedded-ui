import {useCallback, useEffect, useMemo} from 'react';
import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';
import block from 'bem-cn-lite';
import qs from 'qs';

import {Link, Progress} from '@gravity-ui/uikit';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
import InfoViewer, {InfoViewerItem} from '../../components/InfoViewer/InfoViewer';
import {Tags} from '../../components/Tags';
import {Tablet} from '../../components/Tablet';
import {Icon} from '../../components/Icon';
import {Loader} from '../../components/Loader';
import {ResponseError} from '../../components/Errors/ResponseError';

import type {AdditionalVersionsProps} from '../../types/additionalProps';
import {getClusterInfo} from '../../store/reducers/cluster/cluster';
import {getClusterNodes} from '../../store/reducers/clusterNodes/clusterNodes';
import {backend, customBackend} from '../../store';
import {setHeader} from '../../store/reducers/header';
import {formatStorageValues} from '../../utils';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import {parseVersionsToVersionToColorMap, parseNodesToVersionsValues} from '../../utils/versions';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';

import {Versions} from '../Versions/Versions';

import {compareTablets} from './utils';

import './ClusterInfo.scss';

const b = block('cluster-info');

interface ClusterInfoProps {
    clusterTitle?: string;
    additionalClusterInfo?: InfoViewerItem[];
    additionalVersionsProps?: AdditionalVersionsProps;
}

export const ClusterInfo = ({
    clusterTitle,
    additionalClusterInfo = [],
    additionalVersionsProps,
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
            return additionalVersionsProps?.getVersionToColorMap();
        }
        return parseVersionsToVersionToColorMap(cluster?.Versions);
    }, [additionalVersionsProps, cluster]);

    const versionsValues = useMemo(() => {
        return parseNodesToVersionsValues(nodes, versionToColor);
    }, [nodes, versionToColor]);

    const getInfo = () => {
        let link = backend + '/internal';

        if (singleClusterMode && !customBackend) {
            link = `/internal`;
        }

        const info: InfoViewerItem[] = [
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
            {
                label: 'Versions',
                value: <div>{cluster?.Versions?.join(', ')}</div>,
            },
            ...additionalClusterInfo,
            {
                label: 'Internal viewer',
                value: (
                    <Link href={link} target="_blank">
                        <Icon name="external" viewBox={'0 0 16 16'} width={16} height={16} />
                    </Link>
                ),
            },
        ];

        return info;
    };

    if ((loading && !wasLoaded) || (nodesLoading && !nodesWasLoaded)) {
        return <Loader size="l" />;
    }

    if (error || nodesError) {
        return <ResponseError error={error || nodesError} />;
    }

    return (
        <div className={b()}>
            <div className={b('header')}>
                <div className="info">
                    <div className={b('common')}>
                        <div className={b('url')}>
                            <EntityStatus
                                size="m"
                                status={cluster?.Overall}
                                name={clusterTitle ?? cluster?.Name ?? 'Unknown cluster'}
                            />
                        </div>

                        {cluster?.DataCenters && <Tags tags={cluster?.DataCenters} />}

                        <div className={b('system-tablets')}>
                            {cluster?.SystemTablets &&
                                cluster.SystemTablets.sort(compareTablets).map(
                                    (tablet, tabletIndex) => (
                                        <Tablet key={tabletIndex} tablet={tablet} />
                                    ),
                                )}
                        </div>
                    </div>
                    <InfoViewer dots={true} info={getInfo()} />
                </div>
                <div className={b('version-progress')}>
                    <h3 className={b('progress-label')}>Versions</h3>
                    <Progress value={100} stack={versionsValues} />
                </div>
            </div>

            <Versions nodes={nodes} versionToColor={versionToColor} />
        </div>
    );
};
