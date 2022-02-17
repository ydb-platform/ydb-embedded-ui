import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import {connect} from 'react-redux';

import {Link} from 'react-router-dom';
import {Loader} from '@yandex-cloud/uikit';

import InfoViewer from '../../components/InfoViewer/InfoViewer';
import EntityStatus from '../../components/EntityStatus/EntityStatus';

import {getVdiskInfo, clearStore} from '../../store/reducers/vdisk';
import {VDISK_AUTO_RELOAD_INTERVAL} from '../../utils/constants';
import {formatBytes, calcUptime, stringifyVdiskId} from '../../utils';
import routes, {createHref} from '../../routes';

import './Vdisk.scss';

const b = cn('vdisk');

class Vdisk extends React.Component {
    static renderLoader() {
        return (
            <div className={'loader'}>
                <Loader size="l" />
            </div>
        );
    }

    static propTypes = {
        className: PropTypes.string,
        loading: PropTypes.bool,
        wasLoaded: PropTypes.bool,
        error: PropTypes.bool,
        getVdiskInfo: PropTypes.func,
        clearStore: PropTypes.func,
        vdisk: PropTypes.object,
        location: PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    componentDidMount() {
        const {id} = this.props.match.params;

        this.props.getVdiskInfo(id);
        this.reloadDescriptor = setInterval(
            () => this.props.getVdiskInfo(id),
            VDISK_AUTO_RELOAD_INTERVAL,
        );
    }

    componentWillUnmount() {
        this.props.clearStore();
        clearInterval(this.reloadDescriptor);
    }

    renderContent = () => {
        const {
            AllocatedSize,
            ChangeTime,
            DiskSpace,
            FrontQueues,
            Guid,
            NodeId,
            PDiskId,
            Replicated,
            VDiskState,
            VDiskId,
        } = this.props.vdisk;

        const vdiskInfo = [
            {label: 'Allocated Size', value: formatBytes(AllocatedSize)},
            {label: 'Change Time', value: calcUptime(ChangeTime)},
            {label: 'Disk Space', value: <EntityStatus status={DiskSpace} />},
            {label: 'Front Queues', value: <EntityStatus status={FrontQueues} />},
            {label: 'Guid', value: Guid},
            {
                label: 'NodeId',
                value: (
                    <Link
                        className={b('link')}
                        to={createHref(routes.node, {id: NodeId, activeTab: 'storage'})}
                    >
                        {NodeId}
                    </Link>
                ),
            },
            {
                label: 'PDiskId',
                value: (
                    <Link
                        className={b('link')}
                        to={createHref(routes.pdisk, {id: PDiskId}, {node_id: NodeId})}
                    >
                        {PDiskId}
                    </Link>
                ),
            },
            {label: 'Replicated', value: Replicated ? '✓' : '☓'},
            {
                label: 'VDiskState',
                value: VDiskState,
            },
        ];

        return (
            <div className={b()}>
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
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error} = this.props;

        if (loading && !wasLoaded) {
            return Vdisk.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state) => {
    const {data, wasLoaded, loading, error} = state.vdisk;

    let vdisk;
    if (data) {
        vdisk = data.VDiskStateInfo[0];
    }

    return {
        vdisk,
        wasLoaded,
        loading,
        error,
    };
};

const mapDispatchToProps = {
    getVdiskInfo,
    clearStore,
};

export default connect(mapStateToProps, mapDispatchToProps)(Vdisk);
