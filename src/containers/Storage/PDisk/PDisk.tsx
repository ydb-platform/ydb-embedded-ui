import React from 'react';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDisk} from '../../../components/VDisk/VDisk';
import {getPDiskPagePath} from '../../../routes';
import {valueIsDefined} from '../../../utils';
import {cn} from '../../../utils/cn';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import type {StorageViewContext} from '../types';
import {isVdiskActive} from '../utils';

import './PDisk.scss';

const b = cn('pdisk-storage');

const PDISK_MAX_SLOTS_CSS_VAR = '--pdisk-max-slots';

interface PDiskProps {
    data?: PreparedPDisk;
    vDisks?: PreparedVDisk[];
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    className?: string;
    progressBarClassName?: string;
    viewContext?: StorageViewContext;
    maximumSlotsPerDisk?: string;
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
    maximumSlotsPerDisk,
}: PDiskProps) => {
    const {NodeId, PDiskId} = data;
    const pDiskIdsDefined = valueIsDefined(NodeId) && valueIsDefined(PDiskId);

    const anchorRef = React.useRef<HTMLDivElement>(null);

    const renderVDisks = () => {
        if (!vDisks?.length) {
            return null;
        }

        return (
            <div className={b('vdisks')}>
                {vDisks.map((vdisk) => (
                    <div
                        key={vdisk.StringifiedId}
                        className={b('vdisks-item')}
                        style={{
                            // 1 is small enough for empty disks to be of the minimum width
                            // but if all of them are empty, `flex-grow: 1` would size them evenly
                            flexGrow: Number(vdisk.AllocatedSize) || 1,
                        }}
                    >
                        <VDisk data={vdisk} inactive={!isVdiskActive(vdisk, viewContext)} compact />
                    </div>
                ))}
            </div>
        );
    };

    let pDiskPath: string | undefined;

    if (pDiskIdsDefined) {
        pDiskPath = getPDiskPagePath(PDiskId, NodeId);
    }

    return (
        <div
            className={b(null, className)}
            ref={anchorRef}
            style={
                maximumSlotsPerDisk
                    ? ({
                          [PDISK_MAX_SLOTS_CSS_VAR]: maximumSlotsPerDisk,
                      } as React.CSSProperties)
                    : undefined
            }
        >
            {renderVDisks()}
            <HoverPopup
                showPopup={showPopup}
                anchorRef={anchorRef}
                onShowPopup={onShowPopup}
                onHidePopup={onHidePopup}
                popupContent={<PDiskPopup data={data} />}
            >
                <InternalLink to={pDiskPath} className={b('content')}>
                    <DiskStateProgressBar
                        diskAllocatedPercent={data.AllocatedPercent}
                        severity={data.Severity}
                        className={progressBarClassName}
                    />
                    <div className={b('media-type')}>{data.Type}</div>
                </InternalLink>
            </HoverPopup>
        </div>
    );
};
