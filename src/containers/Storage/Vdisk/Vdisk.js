import React, {useEffect, useState, useRef, useMemo} from 'react';
import PropTypes from 'prop-types';
import cn from 'bem-cn-lite';
import _ from 'lodash';
import {Popup} from '@yandex-cloud/uikit';

import {bytesToGB, bytesToSpeed} from '../../../utils/utils';
import routes, {createHref} from '../../../routes';
import {stringifyVdiskId, getPDiskId} from '../../../utils';
import {getPDiskType} from '../../../utils/pdisk';
import DiskStateProgressBar, {
    diskProgressColors,
} from '../DiskStateProgressBar/DiskStateProgressBar';
import {STRUCTURE} from '../../Node/NodePages';

import {colorSeverity, NOT_AVAILABLE_SEVERITY} from '../utils';

import './Vdisk.scss';

const b = cn('vdisk-storage');

const propTypes = {
    SatisfactionRank: PropTypes.object,
    VDiskState: PropTypes.string,
    DiskSpace: PropTypes.string,
    FrontQueues: PropTypes.string,
    Replicated: PropTypes.bool,
    PoolName: PropTypes.string,
    VDiskId: PropTypes.object,
    nodes: PropTypes.object,
};

const stateSeverity = {
    Initial: 3,
    LocalRecoveryError: 5,
    SyncGuidRecoveryError: 5,
    SyncGuidRecovery: 3,
    PDiskError: 5,
    OK: 1,
};

const getStateSeverity = (vDiskState) => {
    return stateSeverity[vDiskState] ?? NOT_AVAILABLE_SEVERITY;
};

const getColorSeverity = (color) => {
    return colorSeverity[color] ?? colorSeverity.Grey;
};

function Vdisk(props) {
    const [severity, setSeverity] = useState(getStateSeverity(props.VDiskState));
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef();

    // determine disk status severity
    useEffect(() => {
        const {DiskSpace, VDiskState, FrontQueues, Replicated} = props;

        // if the disk is not available, this determines its status severity regardless of other features
        if (!VDiskState) {
            setSeverity(NOT_AVAILABLE_SEVERITY);
            return;
        }

        const DiskSpaceSeverity = getColorSeverity(DiskSpace);
        const VDiskSpaceSeverity = getStateSeverity(VDiskState);
        const FrontQueuesSeverity = Math.min(colorSeverity.Orange, getColorSeverity(FrontQueues));

        let newSeverity = Math.max(DiskSpaceSeverity, VDiskSpaceSeverity, FrontQueuesSeverity);
        if (!Replicated && newSeverity === colorSeverity.Green) {
            newSeverity = colorSeverity.Blue;
        }

        setSeverity(newSeverity);
    }, [props.VDiskState, props.DiskSpace, props.FrontQueues, props.Replicated]);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };
    /* eslint-disable */
    const prepareVdiskData = () => {
        const {
            VDiskId,
            VDiskState,
            PoolName,
            SatisfactionRank,
            DiskSpace,
            FrontQueues,
            Replicated,
            UnsyncedVDisks,
            AllocatedSize,
            ReadThroughput,
            WriteThroughput,
        } = props;
        const vdiskData = [{property: 'VDisk', value: stringifyVdiskId(VDiskId)}];
        vdiskData.push({property: 'State', value: VDiskState ?? 'not available'});
        PoolName && vdiskData.push({property: 'StoragePool', value: PoolName});

        SatisfactionRank &&
            SatisfactionRank.FreshRank?.Flag !== diskProgressColors[colorSeverity.Green] &&
            vdiskData.push({
                property: 'Fresh',
                value: SatisfactionRank.FreshRank.Flag,
            });

        SatisfactionRank &&
            SatisfactionRank.LevelRank?.Flag !== diskProgressColors[colorSeverity.Green] &&
            vdiskData.push({
                property: 'Level',
                value: SatisfactionRank.LevelRank.Flag,
            });

        SatisfactionRank &&
            SatisfactionRank.FreshRank?.RankPercent &&
            vdiskData.push({
                property: 'Fresh',
                value: SatisfactionRank.FreshRank.RankPercent,
            });

        SatisfactionRank &&
            SatisfactionRank.LevelRank?.RankPercent &&
            vdiskData.push({
                property: 'Level',
                value: SatisfactionRank.LevelRank.RankPercent,
            });

        DiskSpace &&
            DiskSpace !== diskProgressColors[colorSeverity.Green] &&
            vdiskData.push({property: 'Space', value: DiskSpace});

        FrontQueues &&
            FrontQueues !== diskProgressColors[colorSeverity.Green] &&
            vdiskData.push({property: 'FrontQueues', value: FrontQueues});

        !Replicated && vdiskData.push({property: 'Replicated', value: 'NO'});

        UnsyncedVDisks && vdiskData.push({property: 'UnsyncVDisks', value: UnsyncedVDisks});

        Boolean(Number(AllocatedSize)) &&
            vdiskData.push({
                property: 'Allocated',
                value: bytesToGB(AllocatedSize),
            });

        Boolean(Number(ReadThroughput)) &&
            vdiskData.push({property: 'Read', value: bytesToSpeed(ReadThroughput)});

        Boolean(Number(WriteThroughput)) &&
            vdiskData.push({
                property: 'Write',
                value: bytesToSpeed(WriteThroughput),
            });

        return vdiskData;
    };

    const preparePdiskData = () => {
        const {PDisk, nodes} = props;
        const errorColors = [
            diskProgressColors[colorSeverity.Orange],
            diskProgressColors[colorSeverity.Red],
            diskProgressColors[colorSeverity.Yellow],
        ];
        if (PDisk && nodes) {
            const pdiskData = [{property: 'PDisk', value: getPDiskId(PDisk)}];
            pdiskData.push({
                property: 'State',
                value: PDisk.State || 'not available',
            });
            pdiskData.push({property: 'Type', value: getPDiskType(PDisk) || 'unknown'});
            PDisk.NodeId && pdiskData.push({property: 'Node Id', value: PDisk.NodeId});
            PDisk.NodeId &&
                nodes[PDisk.NodeId] &&
                pdiskData.push({property: 'Host', value: nodes[PDisk.NodeId]});
            PDisk.Path && pdiskData.push({property: 'Path', value: PDisk.Path});
            pdiskData.push({
                property: 'Available',
                value: `${bytesToGB(PDisk.AvailableSize)} of ${bytesToGB(PDisk.TotalSize)}`,
            });
            errorColors.includes(PDisk.Realtime) &&
                pdiskData.push({property: 'Realtime', value: PDisk.Realtime});
            errorColors.includes(PDisk.Device) &&
                pdiskData.push({property: 'Device', value: PDisk.Device});
            return pdiskData;
        }
        return null;
    };
    /* eslint-enable */

    const renderPopup = () => {
        const vdiskData = prepareVdiskData();
        const pdiskData = preparePdiskData();
        return (
            <Popup
                className={b('popup-wrapper')}
                anchorRef={anchor}
                open={isPopupVisible}
                placement={['top', 'bottom']}
                hasArrow
            >
                <div className={b('popup-content')}>
                    <div className={b('popup-section-name')}>VDisk</div>
                    {_.map(vdiskData, (row) => (
                        <React.Fragment key={row.property}>
                            <div className={b('property')}>{row.property}</div>
                            <div className={b('value')}>{row.value}</div>
                        </React.Fragment>
                    ))}
                    <div className={b('popup-section-name')}>PDisk</div>
                    {_.map(pdiskData, (row) => (
                        <React.Fragment key={row.property}>
                            <div className={b('property')}>{row.property}</div>
                            <div className={b('value')}>{row.value}</div>
                        </React.Fragment>
                    ))}
                </div>
            </Popup>
        );
    };

    const vdiskAllocatedPercent = useMemo(() => {
        const {AvailableSize, AllocatedSize, PDisk} = props;
        const available = AvailableSize ? AvailableSize : PDisk?.AvailableSize;

        if (!available) {
            return;
        }
        return !isNaN(Number(AllocatedSize))
            ? (Number(AllocatedSize) * 100) / (Number(available) + Number(AllocatedSize))
            : undefined;
    }, [props.AllocatedSize, props.AvailableSize, props.PDisk?.AvailableSize]);

    return (
        <React.Fragment>
            {renderPopup()}
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                <DiskStateProgressBar
                    diskAllocatedPercent={vdiskAllocatedPercent}
                    severity={severity}
                    href={
                        props.NodeId
                            ? createHref(
                                  routes.node,
                                  {id: props.NodeId, activeTab: STRUCTURE},
                                  {
                                      pdiskId: props.PDisk?.PDiskId,
                                      vdiskId: stringifyVdiskId(props.VDiskId),
                                  },
                              )
                            : undefined
                    }
                />
            </div>
        </React.Fragment>
    );
}

Vdisk.propTypes = propTypes;

export default Vdisk;
