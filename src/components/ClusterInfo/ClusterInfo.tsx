import React, {ReactNode} from 'react';
import cn from 'bem-cn-lite';

import EntityStatus from '../EntityStatus/EntityStatus';
import ProgressViewer from '../ProgressViewer/ProgressViewer';
import InfoViewer from '../InfoViewer/InfoViewer';
import Tags from '../Tags/Tags';
import Tablet from '../Tablet/Tablet';

import {formatStorageValues} from '../../utils';
import {TxAllocator} from '../../utils/constants';

import './ClusterInfo.scss';

const b = cn('cluster-info');

export interface IClusterInfoItem {
    label: string;
    value: ReactNode;
}

interface ICluster {
    StorageTotal: string;
    StorageUsed: string;
    NodesAlive: number;
    NodesTotal: number;
    LoadAverage: number;
    NumberOfCpus: number;
    Versions: string[];
    Name?: string;
    Overall: string;
    DataCenters?: string[];
    SystemTablets?: ITablet[];
}

interface ClusterInfoProps {
    className: string;
    cluster?: ICluster;
    hideTooltip: VoidFunction;
    showTooltip: VoidFunction;
    clusterTitle: string;
    additionalInfo?: IClusterInfoItem[];
}

interface ITablet {
    Type: string;
}

class ClusterInfo extends React.Component<ClusterInfoProps> {
    static compareTablets(tablet1: ITablet, tablet2: ITablet) {
        if (tablet1.Type === TxAllocator) {
            return 1;
        }

        if (tablet2.Type === TxAllocator) {
            return -1;
        }

        return 0;
    }

    shouldComponentUpdate(nextProps: ClusterInfoProps) {
        const {cluster = {}} = nextProps;
        return !(Object.keys(cluster).length === 0);
    }

    render() {
        return this.renderContent();
    }

    private getInfo() {
        const {cluster = {} as ICluster, additionalInfo = []} = this.props;
        const {StorageTotal, StorageUsed} = cluster;

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
            ...additionalInfo,
        ];

        return info;
    }

    private renderContent = () => {
        const {cluster = {} as ICluster, showTooltip, hideTooltip, clusterTitle} = this.props;
        const {Name: clusterName = 'Unknown cluster'} = cluster;

        const info = this.getInfo();

        return (
            <div className={b()}>
                <div className={b('common')}>
                    <span className={b('title')}>cluster</span>
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
            </div>
        );
    };
}

export default ClusterInfo;
