import React from 'react';

import {isNil} from 'lodash';

import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {getPDiskPagePath} from '../../../routes';
import {cn} from '../../../utils/cn';
import type {PDiskDisplayStateGetter} from '../../../utils/disks/displayState';
import {getDefaultPDiskDisplayState} from '../../../utils/disks/displayState';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import i18n from '../i18n';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';

import {PDiskVDisks} from './PDiskVDisks';

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
    const displayState = React.useMemo(
        () => (getDisplayState ?? getDefaultPDiskDisplayState)(data),
        [data, getDisplayState],
    );
    const noDataPlaceholder =
        displayState.showNoDataPlaceholder === false ? undefined : i18n('no-data');

    let pDiskPath: string | undefined;

    if (pDiskIdsDefined) {
        pDiskPath = getPDiskPagePath(PDiskId, NodeId);
    }

    return (
        <div
            className={b(null, className)}
            ref={anchorRef}
            style={{width: displayState.width ?? width}}
        >
            <PDiskVDisks
                vDisks={vDisks}
                viewContext={viewContext}
                withIcon={withIcon}
                delayOpen={delayOpen}
                delayClose={delayClose}
                highlightedDisk={highlightedDisk}
                setHighlightedDisk={setHighlightedDisk}
            />
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
                        diskAllocatedPercent={displayState.allocatedPercent}
                        severity={displayState.severity}
                        icon={displayState.icon}
                        modeModifier={displayState.modeModifier}
                        className={progressBarClassName}
                        inactive={inactive}
                        highlighted={highlighted}
                        isLegendInactive={displayState.isLegendInactive}
                        noDataPlaceholder={noDataPlaceholder}
                    />
                </InternalLink>
            </HoverPopup>
        </div>
    );
};
