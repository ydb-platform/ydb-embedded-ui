import {useVDiskPagePath} from '../../routes';
import {cn} from '../../utils/cn';
import {DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from '../../utils/disks/constants';
import type {PreparedVDisk} from '../../utils/disks/types';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import './VDisk.scss';

const b = cn('ydb-vdisk-component');

export interface VDiskProps {
    data?: PreparedVDisk;
    compact?: boolean;
    inactive?: boolean;
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    progressBarClassName?: string;
    delayOpen?: number;
    delayClose?: number;
    withIcon?: boolean;
}

export const VDisk = ({
    data = {},
    compact,
    inactive,
    showPopup,
    onShowPopup,
    onHidePopup,
    progressBarClassName,
    delayClose,
    delayOpen,
    withIcon,
}: VDiskProps) => {
    const getVDiskLink = useVDiskPagePath();
    const vDiskPath = getVDiskLink({nodeId: data.NodeId, vDiskId: data.StringifiedId});

    const severity = data.Severity;
    const isReplicatingColor = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    const isHealthyDonor = data.DonorMode && isReplicatingColor;

    return (
        <HoverPopup
            showPopup={showPopup}
            onShowPopup={onShowPopup}
            onHidePopup={onHidePopup}
            renderPopupContent={() => <VDiskPopup data={data} />}
            offset={{mainAxis: 2, crossAxis: 0}}
            delayClose={delayClose}
            delayOpen={delayOpen}
        >
            <div className={b()}>
                <InternalLink to={vDiskPath} className={b('content')}>
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={severity}
                        compact={compact}
                        inactive={inactive}
                        striped={isReplicatingColor}
                        isDonor={isHealthyDonor}
                        className={progressBarClassName}
                        withIcon={withIcon}
                        highlighted={showPopup}
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
