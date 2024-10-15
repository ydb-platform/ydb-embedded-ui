import React from 'react';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDisk} from '../../../components/VDisk/VDisk';
import {getPDiskPagePath} from '../../../routes';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {usePopupAnchor} from '../../../utils/hooks/usePopupAnchor';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import './PDisk.scss';

const b = cn('pdisk-storage');

interface PDiskProps {
    data?: PreparedPDisk;
    vDisks?: PreparedVDisk[];
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    className?: string;
    progressBarClassName?: string;
    viewContext?: StorageViewContext;
}

export const PDisk = ({
    data = {},
    vDisks,
    showPopup,
    onShowPopup,
    onHidePopup,
    className,
    progressBarClassName,
    viewContext,
}: PDiskProps) => {
    const {isPopupVisible, anchor, onMouseEnter, onMouseLeave, hidePopup} = usePopupAnchor(
        onShowPopup,
        onHidePopup,
    );

    const {NodeId, PDiskId} = data;
    const pDiskIdsDefined = valueIsDefined(NodeId) && valueIsDefined(PDiskId);

    const renderVDisks = () => {
        if (!vDisks?.length) {
            return null;
        }

        return (
            <div className={b('vdisks')}>
                {vDisks.map((vdisk) => {
                    return (
                        <div
                            key={vdisk.StringifiedId}
                            className={b('vdisks-item')}
                            style={{
                                // 1 is small enough for empty disks to be of the minimum width
                                // but if all of them are empty, `flex-grow: 1` would size them evenly
                                flexGrow: Number(vdisk.AllocatedSize) || 1,
                            }}
                        >
                            <VDisk
                                data={vdisk}
                                inactive={!isVdiskActive(vdisk, viewContext)}
                                compact
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    let pDiskPath: string | undefined;

    if (pDiskIdsDefined) {
        pDiskPath = getPDiskPagePath(PDiskId, NodeId);
    }

    return (
        <React.Fragment>
            <div className={b(null, className)} ref={anchor}>
                {renderVDisks()}
                <InternalLink
                    to={pDiskPath}
                    className={b('content')}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        className={progressBarClassName}
                    />
                    <div className={b('media-type')}>{data.Type}</div>
                </InternalLink>
            </div>
            <PDiskPopup
                data={data}
                anchorRef={anchor}
                open={isPopupVisible || showPopup}
                hidePopup={hidePopup}
            />
        </React.Fragment>
    );
};
