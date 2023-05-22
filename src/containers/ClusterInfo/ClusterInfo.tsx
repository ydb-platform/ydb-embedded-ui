import React, {ReactNode} from 'react';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import {Link, Loader} from '@gravity-ui/uikit';

//@ts-ignore
import EntityStatus from '../../components/EntityStatus/EntityStatus';
//@ts-ignore
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
//@ts-ignore
import InfoViewer from '../../components/InfoViewer/InfoViewer';
import {Tags} from '../../components/Tags';
import {Tablet} from '../../components/Tablet';

//@ts-ignore
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
//@ts-ignore
import {getClusterInfo} from '../../store/reducers/cluster/cluster';
//@ts-ignore
import {clusterName, backend, customBackend} from '../../store';

//@ts-ignore
import {formatStorageValues} from '../../utils';
//@ts-ignore
import {TxAllocator} from '../../utils/constants';
import {AutoFetcher} from '../../utils/autofetcher';
import {Icon} from '../../components/Icon';
import {setHeader} from '../../store/reducers/header';
import routes, {CLUSTER_PAGES, createHref} from '../../routes';

import type {TClusterInfo} from '../../types/api/cluster';
import type {TTabletStateInfo} from '../../types/api/tablet';

import './ClusterInfo.scss';

const b = cn('cluster-info');

export interface IClusterInfoItem {
    label: string;
    value: ReactNode;
}

interface ClusterInfoProps {
    className?: string;
    cluster?: TClusterInfo;
    hideTooltip: VoidFunction;
    showTooltip: (...args: Parameters<typeof showTooltip>) => void;
    setHeader: any;
    getClusterInfo: (clusterName: string) => void;
    clusterTitle?: string;
    additionalClusterInfo?: IClusterInfoItem[];
    loading: boolean;
    singleClusterMode: boolean;
    wasLoaded: boolean;
    error?: {statusText: string};
}

class ClusterInfo extends React.Component<ClusterInfoProps> {
    static compareTablets(tablet1: TTabletStateInfo, tablet2: TTabletStateInfo) {
        if (tablet1.Type === TxAllocator) {
            return 1;
        }

        if (tablet2.Type === TxAllocator) {
            return -1;
        }

        return 0;
    }

    private autofetcher: any;

    componentDidMount() {
        const {setHeader} = this.props;
        setHeader([
            {
                text: CLUSTER_PAGES.cluster.title,
                link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.cluster.id}),
            },
        ]);
        this.props.getClusterInfo(clusterName);
        this.autofetcher = new AutoFetcher();
        this.autofetcher.fetch(() => this.props.getClusterInfo(clusterName));
    }

    shouldComponentUpdate(nextProps: ClusterInfoProps) {
        const {cluster = {}} = nextProps;
        return !(Object.keys(cluster).length === 0);
    }

    componentWillUnmount() {
        this.autofetcher.stop();
    }

    renderLoader() {
        return (
            <div className={b('loader')}>
                <Loader size="l" />
            </div>
        );
    }

    render() {
        const {className, error} = this.props;
        let helper;
        if (error) {
            helper = error.statusText;
        }
        return <div className={b(null, className)}>{helper || this.renderContent()}</div>;
    }

    private getInfo() {
        const {cluster = {}, additionalClusterInfo = [], singleClusterMode} = this.props;
        const {StorageTotal, StorageUsed} = cluster;

        let link = backend + '/internal';

        if (singleClusterMode && !customBackend) {
            link = `/internal`;
        }

        const info: IClusterInfoItem[] = [
            {
                label: 'Nodes',
                value: (
                    <ProgressViewer
                        className={b('metric-field')}
                        value={cluster.NodesAlive}
                        capacity={cluster.NodesTotal}
                    />
                ),
            },
            {
                label: 'Load',
                value: (
                    <ProgressViewer
                        className={b('metric-field')}
                        value={cluster.LoadAverage}
                        capacity={cluster.NumberOfCpus}
                    />
                ),
            },
            {
                label: 'Storage',
                value: (
                    <ProgressViewer
                        className={b('metric-field')}
                        value={StorageUsed}
                        capacity={StorageTotal}
                        formatValues={formatStorageValues}
                    />
                ),
            },
            {
                label: 'Versions',
                value: <div>{cluster.Versions?.join(', ')}</div>,
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
    }

    private renderContent = () => {
        const {
            cluster = {},
            showTooltip,
            hideTooltip,
            clusterTitle,
            loading,
            wasLoaded,
        } = this.props;
        const {Name: clusterName = 'Unknown cluster'} = cluster;

        const info = this.getInfo();

        return loading && !wasLoaded ? (
            this.renderLoader()
        ) : (
            <React.Fragment>
                <div className={b('common')}>
                    <div className={b('url')}>
                        <EntityStatus
                            size="m"
                            status={cluster.Overall}
                            name={clusterTitle ?? clusterName}
                        />
                    </div>

                    {cluster.DataCenters && <Tags tags={cluster.DataCenters} />}

                    <div className={b('system-tablets')}>
                        {cluster.SystemTablets &&
                            cluster.SystemTablets.sort(ClusterInfo.compareTablets).map(
                                (tablet, tabletIndex) => (
                                    <Tablet
                                        onMouseEnter={showTooltip}
                                        onMouseLeave={hideTooltip}
                                        key={tabletIndex}
                                        tablet={tablet}
                                    />
                                ),
                            )}
                    </div>
                </div>
                <InfoViewer dots={true} info={info} />
            </React.Fragment>
        );
    };
}

const mapStateToProps = (state: any) => {
    const {data: cluster, loading, error, wasLoaded} = state.cluster;

    return {
        cluster,
        loading,
        wasLoaded,
        error,
        singleClusterMode: state.singleClusterMode,
    };
};

const mapDispatchToProps = {
    getClusterInfo,
    hideTooltip,
    showTooltip,
    setHeader,
};

export default connect(mapStateToProps, mapDispatchToProps)(ClusterInfo);
