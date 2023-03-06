import React, {useEffect, useState, useRef, useMemo} from 'react';
import cn from 'bem-cn-lite';

import {InternalLink} from '../../../components/InternalLink';

import routes, {createHref} from '../../../routes';
import {EFlag} from '../../../types/api/enums';
import {EVDiskState, TVDiskStateInfo} from '../../../types/api/vdisk';
import {stringifyVdiskId} from '../../../utils';
import {isFullVDiskData} from '../../../utils/storage';

import {STRUCTURE} from '../../Node/NodePages';

import {DiskStateProgressBar, EDiskStateSeverity} from '../DiskStateProgressBar';
import type {NodesHosts} from '../PDiskPopup';
import {VDiskPopup} from '../VDiskPopup';

import type {IUnavailableDonor} from '../utils/types';
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
    data?: TVDiskStateInfo | IUnavailableDonor;
    poolName?: string;
    nodes?: NodesHosts;
    compact?: boolean;
}

export const VDisk = ({data = {}, poolName, nodes, compact}: VDiskProps) => {
    const isFullData = isFullVDiskData(data);

    const [severity, setSeverity] = useState(
        getStateSeverity(isFullData ? data.VDiskState : undefined),
    );
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const anchor = useRef(null);

    // determine disk status severity
    useEffect(() => {
        if (!isFullData) {
            setSeverity(NOT_AVAILABLE_SEVERITY);
            return;
        }

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
    }, [data, isFullData]);

    const showPopup = () => {
        setIsPopupVisible(true);
    };

    const hidePopup = () => {
        setIsPopupVisible(false);
    };

    const vdiskAllocatedPercent = useMemo(() => {
        if (!isFullData) {
            return undefined;
        }

        const {AvailableSize, AllocatedSize, PDisk} = data;
        const available = AvailableSize ? AvailableSize : PDisk?.AvailableSize;

        if (!available) {
            return undefined;
        }

        return isNaN(Number(AllocatedSize))
            ? undefined
            : (Number(AllocatedSize) * 100) / (Number(available) + Number(AllocatedSize));
    }, [data, isFullData]);

    return (
        <React.Fragment>
            <VDiskPopup
                data={data}
                poolName={poolName}
                nodes={nodes}
                anchorRef={anchor}
                open={isPopupVisible}
            />
            <div className={b()} ref={anchor} onMouseEnter={showPopup} onMouseLeave={hidePopup}>
                {data.NodeId && isFullData ? (
                    <InternalLink
                        to={createHref(
                            routes.node,
                            {id: data.NodeId, activeTab: STRUCTURE},
                            {
                                pdiskId: data.PDiskId ?? data.PDisk?.PDiskId,
                                vdiskId: stringifyVdiskId(data.VDiskId),
                            },
                        )}
                        className={b('content')}
                    >
                        <DiskStateProgressBar
                            diskAllocatedPercent={vdiskAllocatedPercent}
                            severity={severity}
                            compact={compact}
                        />
                    </InternalLink>
                ) : (
                    <DiskStateProgressBar
                        diskAllocatedPercent={vdiskAllocatedPercent}
                        severity={severity}
                        compact={compact}
                    />
                )}
            </div>
        </React.Fragment>
    );
};
