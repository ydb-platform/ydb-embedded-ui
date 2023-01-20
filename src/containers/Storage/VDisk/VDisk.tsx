import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';

import {Label, Popup} from '@gravity-ui/uikit';

import {InternalLink} from '../../../components/InternalLink';
import {InfoViewer, InfoViewerItem} from '../../../components/InfoViewer';

import routes, {createHref} from '../../../routes';
import {EFlag} from '../../../types/api/enums';
import {EVDiskState, TVDiskStateInfo} from '../../../types/api/vdisk';
import {stringifyVdiskId, getPDiskId} from '../../../utils';
import {getPDiskType} from '../../../utils/pdisk';
import {bytesToGB, bytesToSpeed} from '../../../utils/utils';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar, EDiskStateSeverity} from '../DiskStateProgressBar';

import {NOT_AVAILABLE_SEVERITY} from '../utils';

import './VDisk.scss';

const b = cn('vdisk-storage');

const stateSeverity: Record<EVDiskState, EDiskStateSeverity> = {
    Initial: EDiskStateSeverity.Yellow,
    LocalRecoveryError: EDiskStateSeverity.Red,
    SyncGuidRecoveryError: EDiskStateSeverity.Red,
    SyncGuidRecovery: EDiskStateSeverity.Yellow,
    PDiskError: EDiskStateSeverity.Red,
    OK: EDiskStateSeverity.Green,
};

const getStateSeverity = (vDiskState?: EVDiskState) => {
    if (!vDiskState) {
        return NOT_AVAILABLE_SEVERITY;
    }

    return stateSeverity[vDiskState] ?? NOT_AVAILABLE_SEVERITY;
};

const getColorSeverity = (color?: EFlag) => {
    if (!color) {
        return EDiskStateSeverity.Grey;
    }

    return EDiskStateSeverity[color] ?? EDiskStateSeverity.Grey;
};

interface VDiskProps {
    data?: TVDiskStateInfo;
    poolName?: string;
    /** NodeId => Host */
    nodes?: {
        [nodeId: number]: string;
    };
}

export const VDisk = ({data = {}, poolName, nodes}: VDiskProps) => {
    const [severity, setSeverity] = useState(getStateSeverity(data.VDiskState));
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

    // determine disk status severity
    useEffect(() => {
        const {DiskSpace, VDiskState, FrontQueues, Replicated, DonorMode} = data;

        // if the disk is not available, this determines its status severity regardless of other features
        if (!VDiskState) {
            setSeverity(NOT_AVAILABLE_SEVERITY);
            return;
        }

        const DiskSpaceSeverity = getColorSeverity(DiskSpace);
        const VDiskSpaceSeverity = getStateSeverity(VDiskState);
        const FrontQueuesSeverity = Math.min(
            EDiskStateSeverity.Orange,
            getColorSeverity(FrontQueues),
        );

        let newSeverity = Math.max(DiskSpaceSeverity, VDiskSpaceSeverity, FrontQueuesSeverity);

        // donors are always in the not replicated state since they are leftovers
        // painting them blue is useless
        if (!Replicated && !DonorMode && newSeverity === EDiskStateSeverity.Green) {
            newSeverity = EDiskStateSeverity.Blue;
        }

        setSeverity(newSeverity);
    }, [data]);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    /* eslint-disable @typescript-eslint/no-unused-expressions */
    const prepareVdiskData = () => {
        const {
            VDiskId,
            VDiskState,
            SatisfactionRank,
            DiskSpace,
            FrontQueues,
            Replicated,
            UnsyncedVDisks,
            AllocatedSize,
            ReadThroughput,
            WriteThroughput,
        } = data;
        const vdiskData: InfoViewerItem[] = [{label: 'VDisk', value: stringifyVdiskId(VDiskId)}];
        vdiskData.push({label: 'State', value: VDiskState ?? 'not available'});
        poolName && vdiskData.push({label: 'StoragePool', value: poolName});

        SatisfactionRank &&
            SatisfactionRank.FreshRank?.Flag !== EFlag.Green &&
            vdiskData.push({
                label: 'Fresh',
                value: SatisfactionRank.FreshRank?.Flag,
            });

        SatisfactionRank &&
            SatisfactionRank.LevelRank?.Flag !== EFlag.Green &&
            vdiskData.push({
                label: 'Level',
                value: SatisfactionRank.LevelRank?.Flag,
            });

        SatisfactionRank &&
            SatisfactionRank.FreshRank?.RankPercent &&
            vdiskData.push({
                label: 'Fresh',
                value: SatisfactionRank.FreshRank.RankPercent,
            });

        SatisfactionRank &&
            SatisfactionRank.LevelRank?.RankPercent &&
            vdiskData.push({
                label: 'Level',
                value: SatisfactionRank.LevelRank.RankPercent,
            });

        DiskSpace &&
            DiskSpace !== EFlag.Green &&
            vdiskData.push({label: 'Space', value: DiskSpace});

        FrontQueues &&
            FrontQueues !== EFlag.Green &&
            vdiskData.push({label: 'FrontQueues', value: FrontQueues});

        !Replicated && vdiskData.push({label: 'Replicated', value: 'NO'});

        UnsyncedVDisks && vdiskData.push({label: 'UnsyncVDisks', value: UnsyncedVDisks});

        Boolean(Number(AllocatedSize)) &&
            vdiskData.push({
                label: 'Allocated',
                value: bytesToGB(AllocatedSize),
            });

        Boolean(Number(ReadThroughput)) &&
            vdiskData.push({label: 'Read', value: bytesToSpeed(ReadThroughput)});

        Boolean(Number(WriteThroughput)) &&
            vdiskData.push({
                label: 'Write',
                value: bytesToSpeed(WriteThroughput),
            });

        return vdiskData;
    };

    const preparePdiskData = () => {
        const {PDisk} = data;
        const errorColors = [EFlag.Orange, EFlag.Red, EFlag.Yellow];
        if (PDisk && nodes) {
            const pdiskData: InfoViewerItem[] = [{label: 'PDisk', value: getPDiskId(PDisk)}];
            pdiskData.push({
                label: 'State',
                value: PDisk.State || 'not available',
            });
            pdiskData.push({label: 'Type', value: getPDiskType(PDisk) || 'unknown'});
            PDisk.NodeId && pdiskData.push({label: 'Node Id', value: PDisk.NodeId});
            PDisk.NodeId &&
                nodes[PDisk.NodeId] &&
                pdiskData.push({label: 'Host', value: nodes[PDisk.NodeId]});
            PDisk.Path && pdiskData.push({label: 'Path', value: PDisk.Path});
            pdiskData.push({
                label: 'Available',
                value: `${bytesToGB(PDisk.AvailableSize)} of ${bytesToGB(PDisk.TotalSize)}`,
            });
            PDisk.Realtime &&
                errorColors.includes(PDisk.Realtime) &&
                pdiskData.push({label: 'Realtime', value: PDisk.Realtime});
            PDisk.Device &&
                errorColors.includes(PDisk.Device) &&
                pdiskData.push({label: 'Device', value: PDisk.Device});
            return pdiskData;
        }
        return undefined;
    };
    /* eslint-enable @typescript-eslint/no-unused-expressions */

    const renderPopup = () => (
        <Popup
            className={b('popup-wrapper')}
            anchorRef={anchor}
            open={isPopupVisible}
            placement={['top', 'bottom']}
            // bigger offset for easier switching to neighbour nodes
            // matches the default offset for popup with arrow out of a sense of beauty
            offset={[0, 12]}
        >
            {data.DonorMode && <Label className={b('donor-label')}>Donor</Label>}
            <InfoViewer title="VDisk" info={prepareVdiskData()} size="s" />
            <InfoViewer title="PDisk" info={preparePdiskData()} size="s" />
        </Popup>
    );

    const vdiskAllocatedPercent = useMemo(() => {
        const {AvailableSize, AllocatedSize, PDisk} = data;
        const available = AvailableSize ? AvailableSize : PDisk?.AvailableSize;

        if (!available) {
            return undefined;
        }

        return isNaN(Number(AllocatedSize))
            ? undefined
            : (Number(AllocatedSize) * 100) / (Number(available) + Number(AllocatedSize));
    }, [data]);

    return (
        <React.Fragment>
            {renderPopup()}
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                {data.NodeId ? (
                    <InternalLink
                        to={createHref(
                            routes.node,
                            {id: data.NodeId, activeTab: STRUCTURE},
                            {
                                pdiskId: data.PDisk?.PDiskId,
                                vdiskId: stringifyVdiskId(data.VDiskId),
                            },
                        )}
                        className={b('content')}
                    >
                        <DiskStateProgressBar
                            diskAllocatedPercent={vdiskAllocatedPercent}
                            severity={severity}
                        />
                    </InternalLink>
                ) : (
                    <DiskStateProgressBar
                        diskAllocatedPercent={vdiskAllocatedPercent}
                        severity={severity}
                    />
                )}
            </div>
        </React.Fragment>
    );
};
