import React, {useCallback, useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {useLocation} from 'react-router';
import block from 'bem-cn-lite';
import qs from 'qs';

import {Link} from '@gravity-ui/uikit';

import EntityStatus from '../../components/EntityStatus/EntityStatus';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
import InfoViewer, {InfoViewerItem} from '../../components/InfoViewer/InfoViewer';
import {Tags} from '../../components/Tags';
import {Tablet} from '../../components/Tablet';
import {Icon} from '../../components/Icon';
import {Loader} from '../../components/Loader';
import {ResponseError} from '../../components/Errors/ResponseError';

import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {getClusterInfo} from '../../store/reducers/cluster/cluster';
import {backend, customBackend} from '../../store';
import {setHeader} from '../../store/reducers/header';
import {formatStorageValues} from '../../utils';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';

import {compareTablets} from './utils';

import './ClusterInfo.scss';

const b = block('cluster-info');

interface ClusterInfoProps {
    clusterTitle?: string;
    additionalClusterInfo?: InfoViewerItem[];
}

export const ClusterInfo = ({clusterTitle, additionalClusterInfo = []}: ClusterInfoProps) => {
    const dispatch = useDispatch();
    const location = useLocation();

    const queryParams = qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });
    const {clusterName} = queryParams;

    const {data: cluster, loading, wasLoaded, error} = useTypedSelector((state) => state.cluster);
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
    }, [dispatch, clusterName]);

    useAutofetcher(fetchData, [fetchData], true);

    const onShowTooltip = (...args: Parameters<typeof showTooltip>) => {
        dispatch(showTooltip(...args));
    };

    const onHideTooltip = () => {
        dispatch(hideTooltip());
    };

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

    if (loading && !wasLoaded) {
        return <Loader size="l" />;
    }

    if (error) {
        return <ResponseError error={error} />;
    }
    return (
        <React.Fragment>
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
                        cluster.SystemTablets.sort(compareTablets).map((tablet, tabletIndex) => (
                            <Tablet
                                onMouseEnter={onShowTooltip}
                                onMouseLeave={onHideTooltip}
                                key={tabletIndex}
                                tablet={tablet}
                            />
                        ))}
                </div>
            </div>
            <InfoViewer dots={true} info={getInfo()} />
        </React.Fragment>
    );
};
