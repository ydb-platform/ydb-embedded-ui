import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';
import _ from 'lodash';

import {Link} from 'react-router-dom';
import {Loader} from '@yandex-cloud/uikit';

import InfoViewer from '../../components/InfoViewer/InfoViewer';
import EntityStatus from '../../components/EntityStatus/EntityStatus';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';
import PoolsGraph from '../../components/PoolsGraph/PoolsGraph';
import {AutoFetcher} from '../../utils/autofetcher';

import {getVdiskInfo, clearStore as clearStoreVDisk} from '../../store/reducers/vdisk';
import {getPdiskInfo, clearStore as clearStorePDisk} from '../../store/reducers/pdisk';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';
import {getNodeInfo} from '../../store/reducers/node';
import {calcUptime, stringifyVdiskId, formatStorageValuesToGb} from '../../utils';
import routes, {createHref} from '../../routes';
import {bytesToSpeed, bytesToGB} from '../../utils/utils';
import {getDefaultNodePath} from '../Node/NodePages';

import './VdiskPdiskNode.scss';

const b = cn('vdisk-pdisk-node');

function valueIsDefined(value) {
    return value !== null && value !== undefined;
}

function Vdisk({
    AllocatedSize,
    DiskSpace,
    FrontQueues,
    Guid,
    Replicated,
    VDiskState,
    VDiskId,
    VDiskSlotId,
    Kind,
    SatisfactionRank,
    AvailableSize,
    HasUnreadableBlobs,
    IncarnationGuid,
    InstanceGuid,
    StoragePoolName,
    ReadThroughput,
    WriteThroughput,
}) {
    const vdiskInfo = [];

    if (valueIsDefined(VDiskSlotId)) {
        vdiskInfo.push({label: 'VDisk Slot Id', value: VDiskSlotId});
    }
    if (valueIsDefined(Guid)) {
        vdiskInfo.push({label: 'GUID', value: Guid});
    }
    if (valueIsDefined(Kind)) {
        vdiskInfo.push({label: 'Kind', value: Kind});
    }
    if (valueIsDefined(VDiskState)) {
        vdiskInfo.push({
            label: 'VDisk State',
            value: VDiskState,
        });
    }
    if (valueIsDefined(DiskSpace)) {
        vdiskInfo.push({
            label: 'Disk Space',
            value: <EntityStatus status={DiskSpace} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.FreshRank.Flag)) {
        vdiskInfo.push({
            label: 'Fresh Rank Satisfaction',
            value: <EntityStatus status={SatisfactionRank.FreshRank.Flag} />,
        });
    }
    if (valueIsDefined(SatisfactionRank?.LevelRank.Flag)) {
        vdiskInfo.push({
            label: 'Level Rank Satisfaction',
            value: <EntityStatus status={SatisfactionRank.LevelRank.Flag} />,
        });
    }
    vdiskInfo.push({label: 'Replicated', value: Replicated ? 'Yes' : 'No'});
    vdiskInfo.push({label: 'Allocated Size', value: bytesToGB(AllocatedSize)});
    vdiskInfo.push({label: 'Available Size', value: bytesToGB(AvailableSize)});
    if (Number(AllocatedSize) >= 0 && Number(AvailableSize) >= 0) {
        vdiskInfo.push({
            label: 'Size',
            value: (
                <ProgressViewer
                    value={AllocatedSize}
                    capacity={Number(AllocatedSize) + Number(AvailableSize)}
                    formatValues={formatStorageValuesToGb}
                    colorizeProgress={true}
                    className={b('size')}
                />
            ),
        });
    }

    vdiskInfo.push({
        label: 'Has Unreadable Blobs',
        value: HasUnreadableBlobs ? 'Yes' : 'No',
    });
    if (valueIsDefined(IncarnationGuid)) {
        vdiskInfo.push({label: 'Incarnation GUID', value: IncarnationGuid});
    }
    if (valueIsDefined(InstanceGuid)) {
        vdiskInfo.push({label: 'Instance GUID', value: InstanceGuid});
    }
    if (valueIsDefined(FrontQueues)) {
        vdiskInfo.push({
            label: 'Front Queues',
            value: <EntityStatus status={FrontQueues} />,
        });
    }
    if (valueIsDefined(StoragePoolName)) {
        vdiskInfo.push({label: 'Storage Pool Name', value: StoragePoolName});
    }
    vdiskInfo.push({
        label: 'Read Throughput',
        value: bytesToSpeed(ReadThroughput),
    });
    vdiskInfo.push({
        label: 'Write Throughput',
        value: bytesToSpeed(WriteThroughput),
    });

    return (
        <React.Fragment>
            <div className={b('row')}>
                <span className={b('title')}>VDisk </span>
                <EntityStatus
                    status={VDiskState === 'OK' ? 'green' : 'red'}
                    name={stringifyVdiskId(VDiskId)}
                />
            </div>

            <div className={b('column')}>
                <InfoViewer className={b('section')} info={vdiskInfo} />
            </div>
        </React.Fragment>
    );
}

class VdiskPdiskNode extends React.Component {
    // если не завести три функции, то отрисуется только один лоадер, а мне надо чтобы отрисовывался в каждой колонке
    renderLoader = () => {
        return (
            <div className={b('loader')}>
                <Loader size="l" />
            </div>
        );
    };

    static propTypes = {
        className: PropTypes.string,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        getVdiskInfo: PropTypes.func,
        clearStore: PropTypes.func,
        vdisks: PropTypes.array,
        location: PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    componentDidMount() {
        const params = new URLSearchParams(this.props.location.search);
        const nodeId = params.get('nodeId');
        const pdiskId = params.get('pdiskId');
        const vdiskId = params.get('vdiskId');

        this.props.getVdiskInfo({vdiskId, pdiskId, nodeId});
        this.vDiskAutofetcher = new AutoFetcher();
        this.vDiskAutofetcher.fetch(() => this.props.getVdiskInfo({vdiskId, pdiskId, nodeId}));

        if (nodeId && pdiskId) {
            this.props.getPdiskInfo(nodeId, pdiskId);
            this.pDiskAutofetcher = new AutoFetcher();
            this.pDiskAutofetcher.fetch(() => this.props.getPdiskInfo(nodeId, pdiskId));
        }
        if (nodeId) {
            this.props.getNodeInfo(nodeId);
            this.nodeAutofetcher = new AutoFetcher();
            this.nodeAutofetcher.fetch(() => this.props.getNodeInfo(nodeId));
        }
    }

    componentWillUnmount() {
        this.props.clearStoreVDisk();
        this.props.clearStorePDisk();
        this.vDiskAutofetcher.stop();
        this.pDiskAutofetcher.stop();
        this.nodeAutofetcher.stop();
    }

    renderVdisks = () => {
        return _.map(this.props.vdisks, (v) => {
            if (_.isEmpty(v)) {
                return <div>No information about VDisk</div>;
            }
            return <Vdisk {...v} />;
        });
    };

    renderPDisk = () => {
        if (_.isEmpty(this.props.pdisk)) {
            return <div>No information about PDisk</div>;
        }
        const {
            TotalSize,
            AvailableSize,
            Device,
            Guid,
            NodeId,
            PDiskId,
            Path,
            Realtime,
            State,
            Category,
            SerialNumber,
        } = this.props.pdisk;

        const pdiskInfo = [
            {
                label: 'PDisk Id',
                value: (
                    <Link
                        className={b('link')}
                        to={createHref(routes.pdisk, {id: PDiskId}, {node_id: NodeId})}
                    >
                        {PDiskId}
                    </Link>
                ),
            },
        ];
        if (valueIsDefined(Path)) {
            pdiskInfo.push({label: 'Path', value: Path});
        }
        if (valueIsDefined(Guid)) {
            pdiskInfo.push({label: 'GUID', value: Guid});
        }
        if (valueIsDefined(Category)) {
            pdiskInfo.push({label: 'Category', value: Category});
        }
        pdiskInfo.push({
            label: 'Allocated Size',
            value: bytesToGB(TotalSize - AvailableSize),
        });
        pdiskInfo.push({
            label: 'Available Size',
            value: bytesToGB(AvailableSize),
        });
        if (Number(TotalSize) >= 0 && Number(AvailableSize) >= 0) {
            pdiskInfo.push({
                label: 'Size',
                value: (
                    <ProgressViewer
                        value={TotalSize - AvailableSize}
                        capacity={TotalSize}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                        className={b('size')}
                    />
                ),
            });
        }
        if (valueIsDefined(State)) {
            pdiskInfo.push({label: 'State', value: State});
        }
        if (valueIsDefined(Device)) {
            pdiskInfo.push({
                label: 'Device',
                value: <EntityStatus status={Device} />,
            });
        }
        if (valueIsDefined(Realtime)) {
            pdiskInfo.push({
                label: 'Realtime',
                value: <EntityStatus status={Realtime} />,
            });
        }
        if (valueIsDefined(SerialNumber)) {
            pdiskInfo.push({label: 'SerialNumber', value: SerialNumber});
        }

        return (
            <React.Fragment>
                <div className={b('row')}>
                    <span className={b('title')}>PDisk </span>
                    <EntityStatus status={Device} name={`${NodeId}-${PDiskId}`} />
                </div>

                <div className={b('column')}>
                    <InfoViewer className={b('section')} info={pdiskInfo} />
                </div>
            </React.Fragment>
        );
    };

    renderNode = () => {
        if (_.isEmpty(this.props.node)) {
            return <div>No information about Node</div>;
        }
        const {
            NodeId,
            SystemState,
            StartTime,
            Host,
            DataCenterDescription,
            DataCenter,
            Rack,
            Version,
            LoadAverage,
            NumberOfCpus,
            MemoryUsed,
            MemoryLimit,
            PoolStats,
        } = this.props.node;

        const nodeInfo = [
            {
                label: 'Node Id',
                value: (
                    <Link className={b('link')} to={getDefaultNodePath(NodeId)}>
                        {NodeId}
                    </Link>
                ),
            },
        ];

        if (valueIsDefined(Host)) {
            nodeInfo.push({label: 'Host', value: Host});
        }
        if (valueIsDefined(PoolStats)) {
            nodeInfo.push({
                label: 'Pool stats',
                value: (
                    <PoolsGraph
                        onMouseEnter={this.props.showTooltip}
                        onMouseLeave={this.props.hideTooltip}
                        pools={PoolStats}
                    />
                ),
            });
        }
        if (!_.isEmpty(LoadAverage) && valueIsDefined(NumberOfCpus)) {
            nodeInfo.push({
                label: 'Load Average',
                value: (
                    <ProgressViewer
                        value={
                            (LoadAverage[0] * 100) / NumberOfCpus < 100
                                ? (LoadAverage[0] * 100) / NumberOfCpus
                                : 100
                        }
                        capacity={100}
                        percents={true}
                        colorizeProgress={true}
                        className={b('size')}
                    />
                ),
            });
            nodeInfo.push({
                label: 'Load Average',
                value: `${LoadAverage[0]} / ${NumberOfCpus} Cpus`,
            });
        }
        if (valueIsDefined(StartTime)) {
            nodeInfo.push({label: 'Uptime', value: calcUptime(StartTime)});
        }
        if (valueIsDefined(SystemState)) {
            nodeInfo.push({
                label: 'System State',
                value: <EntityStatus status={SystemState} />,
            });
        }
        if (valueIsDefined(DataCenter)) {
            nodeInfo.push({label: 'DataCenter', value: DataCenter.toUpperCase()});
        }
        if (valueIsDefined(DataCenterDescription)) {
            nodeInfo.push({
                label: 'DataCenter Description',
                value: DataCenterDescription,
            });
        }
        if (valueIsDefined(Rack)) {
            nodeInfo.push({label: 'Rack', value: Rack});
        }
        if (valueIsDefined(Version)) {
            nodeInfo.push({label: 'Version', value: Version});
        }
        if (valueIsDefined(MemoryUsed)) {
            nodeInfo.push({label: 'Memory used', value: bytesToGB(MemoryUsed)});
        }
        if (valueIsDefined(MemoryLimit)) {
            nodeInfo.push({label: 'Memory limit', value: bytesToGB(MemoryLimit)});
        }
        if (valueIsDefined(MemoryLimit) && valueIsDefined(MemoryUsed)) {
            nodeInfo.push({
                label: 'Memory used',
                value: (
                    <ProgressViewer
                        value={MemoryUsed || 0}
                        capacity={MemoryLimit || 0}
                        formatValues={formatStorageValuesToGb}
                        colorizeProgress={true}
                        className={b('size')}
                    />
                ),
            });
        }

        return (
            <React.Fragment>
                <div className={b('row')}>
                    <span className={b('title')}>Node </span>
                    <EntityStatus status={SystemState} name={`${NodeId}-${Host}`} />
                </div>

                <div className={b('column')}>
                    <InfoViewer className={b('section')} info={nodeInfo} />
                </div>
            </React.Fragment>
        );
    };

    render() {
        const {
            loadingVDisk,
            wasLoadedVDisk,
            errorVDisk,
            loadingPDisk,
            wasLoadedPDisk,
            errorPDisk,
            loadingNode,
            wasLoadedNode,
            errorNode,
        } = this.props;

        return (
            <div className={b()}>
                <div>
                    {(loadingVDisk && !wasLoadedVDisk && this.renderLoader()) ||
                        (errorVDisk && errorVDisk.statusText) ||
                        this.renderVdisks()}
                </div>
                <div>
                    {(loadingPDisk && !wasLoadedPDisk && this.renderLoader()) ||
                        (errorPDisk && errorPDisk.statusText) ||
                        this.renderPDisk()}
                </div>
                <div>
                    {(loadingNode && !wasLoadedNode && this.renderLoader()) ||
                        (errorNode && errorNode.statusText) ||
                        this.renderNode()}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const {
        data: vdiskData,
        wasLoaded: wasLoadedVDisk,
        loading: loadingVDisk,
        error: errorVDisk,
    } = state.vdisk;
    const {
        data: pdiskData,
        wasLoaded: wasLoadedPDisk,
        loading: loadingPDisk,
        error: errorPDisk,
    } = state.pdisk;
    const {
        data: nodeData,
        wasLoaded: wasLoadedNode,
        loading: loadingNode,
        error: errorNode,
    } = state.node;

    let pdisk = {};
    let node = {};
    if (pdiskData && pdiskData.PDiskStateInfo) {
        pdisk = pdiskData.PDiskStateInfo[0];
    }
    if (nodeData && nodeData.SystemStateInfo) {
        node = nodeData.SystemStateInfo[0];
    }

    return {
        vdisks: vdiskData?.VDiskStateInfo,
        wasLoadedVDisk,
        loadingVDisk,
        errorVDisk,
        pdisk,
        wasLoadedPDisk,
        loadingPDisk,
        errorPDisk,
        node,
        wasLoadedNode,
        loadingNode,
        errorNode,
    };
};

const mapDispatchToProps = {
    getVdiskInfo,
    getPdiskInfo,
    getNodeInfo,
    clearStoreVDisk,
    clearStorePDisk,
    hideTooltip,
    showTooltip,
};

export default connect(mapStateToProps, mapDispatchToProps)(VdiskPdiskNode);
