import React from 'react';

import {isNil} from 'lodash';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {VDisk} from '../../../components/VDisk/VDisk';
import {getPDiskPagePath} from '../../../routes';
import {cn} from '../../../utils/cn';
import {NOT_AVAILABLE_SEVERITY} from '../../../utils/disks/constants';
import type {PDiskDisplayStateGetter} from '../../../utils/disks/displayState';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import i18n from '../i18n';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
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
    width?: number;
    delayOpen?: number;
    delayClose?: number;
    withIcon?: boolean;
    inactive?: boolean;
    highlighted?: boolean;
    highlightedDisk?: string;
    setHighlightedDisk?: (id?: string) => void;
    getDisplayState?: PDiskDisplayStateGetter;
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
    width,
    delayOpen = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    delayClose = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    withIcon,
    inactive,
    highlighted,
    highlightedDisk,
    setHighlightedDisk,
    getDisplayState,
}: PDiskProps) => {
    const {NodeId, PDiskId} = data;
    const pDiskIdsDefined = !isNil(NodeId) && !isNil(PDiskId);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const displayState = React.useMemo(() => getDisplayState?.(data), [data, getDisplayState]);
    const isStateMode = displayState?.modeModifier === 'mode-state';
    const shouldShowNoDataPlaceholder =
        !isStateMode ||
        (displayState.showNoDataPlaceholder && displayState.severity === NOT_AVAILABLE_SEVERITY);
    const noDataPlaceholder = shouldShowNoDataPlaceholder ? i18n('no-data') : undefined;

    const renderVDisks = () => {
        if (!vDisks?.length) {
            return null;
        }

        return (
            <div className={b('vdisks')}>
                {vDisks.map((vdisk) => {
                    const vDiskId = vdisk.StringifiedId;
                    const vDiskHighlighted = highlightedDisk === vDiskId;

                    return (
                        <div
                            key={vDiskId}
                            className={b('vdisks-item')}
                            style={{
                                // 1 is small enough for empty disks to be of the minimum width
                                // but if all of them are empty, `flex-grow: 1` would size them evenly
                                flexGrow: Number(vdisk.AllocatedSize) || 1,
                            }}
                        >
                            <VDisk
                                withIcon={withIcon}
                                data={vdisk}
                                inactive={!isVdiskActive(vdisk, viewContext)}
                                compact
                                delayOpen={delayOpen}
                                delayClose={delayClose}
                                showPopup={vDiskHighlighted}
                                onShowPopup={() => setHighlightedDisk?.(vDiskId)}
                                onHidePopup={() => setHighlightedDisk?.(undefined)}
                                highlighted={vDiskHighlighted}
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
        <div
            className={b(null, className)}
            ref={anchorRef}
            style={{width: isStateMode ? 55 : width}}
        >
            {renderVDisks()}
            <HoverPopup
                showPopup={showPopup}
                offset={{mainAxis: 2, crossAxis: 0}}
                anchorRef={anchorRef}
                onShowPopup={onShowPopup}
                onHidePopup={onHidePopup}
                renderPopupContent={() => <PDiskPopup data={data} />}
                delayOpen={delayOpen}
                delayClose={delayClose}
            >
                <InternalLink to={pDiskPath} className={b('content')}>
                    <DiskStateProgressBar
                        withIcon={withIcon}
                        diskAllocatedPercent={isStateMode ? undefined : data.AllocatedPercent}
                        severity={displayState?.severity ?? data.Severity}
                        icon={displayState?.icon}
                        modeModifier={displayState?.modeModifier}
                        className={progressBarClassName}
                        inactive={inactive}
                        highlighted={highlighted}
                        isLegendInactive={displayState?.isLegendInactive}
                        noDataPlaceholder={noDataPlaceholder}
                    />
                </InternalLink>
            </HoverPopup>
        </div>
    );
};
