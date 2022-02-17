import React from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import qs from 'qs';
import {connect} from 'react-redux';

import {Link} from 'react-router-dom';
import {Loader} from '@yandex-cloud/uikit';

import InfoViewer from '../../components/InfoViewer/InfoViewer';
import EntityStatus from '../../components/EntityStatus/EntityStatus';
import ProgressViewer from '../../components/ProgressViewer/ProgressViewer';

import {getPdiskInfo, clearStore} from '../../store/reducers/pdisk';
import {PDISK_AUTO_RELOAD_INTERVAL} from '../../utils/constants';
import {formatStorageValues, calcUptime} from '../../utils';
import routes, {createHref} from '../../routes';

import './Pdisk.scss';

const b = cn('pdisk');

class Pdisk extends React.Component {
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
        getPdiskInfo: PropTypes.func,
        clearStore: PropTypes.func,
        pdisk: PropTypes.object,
        location: PropTypes.object,
    };

    static defaultProps = {
        className: '',
    };

    componentDidMount() {
        const queryParams = qs.parse(this.props.location.search, {
            ignoreQueryPrefix: true,
        });
        const nodeId = queryParams.node_id;
        this.props.getPdiskInfo(nodeId);
        this.reloadDescriptor = setInterval(
            () => this.props.getPdiskInfo(nodeId),
            PDISK_AUTO_RELOAD_INTERVAL,
        );
    }

    componentWillUnmount() {
        this.props.clearStore();
        clearInterval(this.reloadDescriptor);
    }

    renderContent = () => {
        const {
            TotalSize,
            AvailableSize,
            ChangeTime,
            Device,
            Guid,
            NodeId,
            PDiskId,
            Path,
            Realtime,
            State,
        } = this.props.pdisk;

        const pdiskInfo = [
            {label: 'Device', value: <EntityStatus status={Device} />},
            {label: 'Realtime', value: <EntityStatus status={Realtime} />},
            {label: 'State', value: State},
            {
                label: 'Size',
                value: (
                    <ProgressViewer
                        value={TotalSize - AvailableSize || 0}
                        capacity={TotalSize || 0}
                        formatValues={formatStorageValues}
                        colorizeProgress={true}
                        className={b('size')}
                    />
                ),
            },
            {label: 'ChangeTime', value: calcUptime(ChangeTime)},
            {label: 'Path', value: Path},
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
        ];

        return (
            <div className={b()}>
                <div className={b('row')}>
                    <span className={b('title')}>PDisk </span>
                    <EntityStatus status={Device} name={PDiskId} />
                </div>

                <div className={b('column')}>
                    <InfoViewer className={b('section')} info={pdiskInfo} />
                </div>
            </div>
        );
    };

    render() {
        const {loading, wasLoaded, error} = this.props;

        if (loading && !wasLoaded) {
            return Pdisk.renderLoader();
        } else if (error) {
            return <div>{error.statusText}</div>;
        } else {
            return this.renderContent();
        }
    }
}

const mapStateToProps = (state, ownProps) => {
    const {data, wasLoaded, loading, error} = state.pdisk;

    const {id} = ownProps.match.params;
    let pdisk;
    if (data) {
        pdisk = data.PDiskStateInfo.filter((disk) => disk.PDiskId === Number(id))[0];
    }

    return {
        pdisk,
        wasLoaded,
        loading,
        error,
    };
};

const mapDispatchToProps = {
    getPdiskInfo,
    clearStore,
};

export default connect(mapStateToProps, mapDispatchToProps)(Pdisk);
