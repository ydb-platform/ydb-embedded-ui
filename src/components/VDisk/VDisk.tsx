import React from 'react';

import {cn} from '../../utils/cn';
import type {PreparedVDisk} from '../../utils/disks/types';
import {DiskStateProgressBar} from '../DiskStateProgressBar/DiskStateProgressBar';
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
    const [isPopupVisible, setIsPopupVisible] = React.useState(false);

    const anchor = React.useRef(null);

    const handleShowPopup = () => {
        setIsPopupVisible(true);
        onShowPopup?.();
    };

    const handleHidePopup = () => {
        setIsPopupVisible(false);
        onHidePopup?.();
    };

    const vDiskPath = getVDiskLink(data);

    return (
        <React.Fragment>
            <div
                className={b()}
                ref={anchor}
                onMouseEnter={handleShowPopup}
                onMouseLeave={handleHidePopup}
            >
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
            <VDiskPopup data={data} anchorRef={anchor} open={isPopupVisible || showPopup} />
        </React.Fragment>
    );
};
