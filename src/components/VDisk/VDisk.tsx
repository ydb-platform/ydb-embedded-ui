import {cn} from '../../utils/cn';
import type {PreparedVDisk} from '../../utils/disks/types';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../HoverPopup/HoverPopup';
import {InternalLink} from '../InternalLink';
import {VDiskPopup} from '../VDiskPopup/VDiskPopup';

import {getVDiskLink} from './utils';

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
}

export const VDisk = ({
    data = {},
    compact,
    inactive,
    showPopup,
    onShowPopup,
    onHidePopup,
    progressBarClassName,
}: VDiskProps) => {
    const vDiskPath = getVDiskLink(data);

    return (
        <HoverPopup
            showPopup={showPopup}
            onShowPopup={onShowPopup}
            onHidePopup={onHidePopup}
            popupContent={<VDiskPopup data={data} />}
        >
            <div className={b()}>
                <InternalLink to={vDiskPath} className={b('content')}>
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        compact={compact}
                        inactive={inactive}
                        className={progressBarClassName}
                    />
                </InternalLink>
            </div>
        </HoverPopup>
    );
};
