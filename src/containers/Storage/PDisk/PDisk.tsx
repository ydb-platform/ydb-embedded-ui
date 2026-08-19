import React from 'react';

import {isNil} from 'lodash';

import {DiskBarLabel} from '../../../components/DiskStateProgressBar/DiskBarLabel';
import {DiskIndicator} from '../../../components/DiskStateProgressBar/DiskIndicator';
import {DiskStateProgressBar} from '../../../components/DiskStateProgressBar/DiskStateProgressBar';
import {PDiskAllModeIndicators} from '../../../components/DiskStateProgressBar/PDiskAllModeIndicators';
import {HoverPopup} from '../../../components/HoverPopup/HoverPopup';
import {InternalLink} from '../../../components/InternalLink';
import {PDiskPopup} from '../../../components/PDiskPopup/PDiskPopup';
import {getPDiskPagePath} from '../../../routes';
import {cn} from '../../../utils/cn';
import type {
    DiskDisplayMode,
    DiskIndicatorValue,
    PDiskAllModeIndicatorsState,
    PDiskDisplayStateGetter,
} from '../../../utils/disks/displayState';
import {getDefaultPDiskDisplayState} from '../../../utils/disks/displayState';
import {getDiskBarTone} from '../../../utils/disks/getDiskBarTone';
import {getPDiskId, getVDiskStatusIcon} from '../../../utils/disks/helpers';
import type {PreparedPDisk, PreparedVDisk} from '../../../utils/disks/types';
import {isNumeric} from '../../../utils/utils';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';
import type {StorageViewContext} from '../types';

import {PDiskVDisks} from './PDiskVDisks';
import {i18n} from './i18n';

import './PDisk.scss';

const b = cn('pdisk-storage');
const EMPTY_ALL_MODE_INDICATORS = {};

interface GetPDiskBarContentParams {
    allocatedPercent?: number;
    hidden: boolean;
    isAllMode: boolean;
    noDataPlaceholder?: React.ReactNode;
    showAllocatedPercentLabel?: boolean;
    showNoDataPlaceholder?: boolean;
}

function getPDiskBarContent({
    allocatedPercent,
    hidden,
    isAllMode,
    noDataPlaceholder,
    showAllocatedPercentLabel,
    showNoDataPlaceholder,
}: GetPDiskBarContentParams) {
    if (hidden) {
        return null;
    }

    const hasAllocatedPercent = isNumeric(allocatedPercent) && allocatedPercent >= 0;
    if (hasAllocatedPercent && showAllocatedPercentLabel !== false) {
        return <DiskBarLabel>{`${Math.floor(allocatedPercent)}%`}</DiskBarLabel>;
    }

    if (
        noDataPlaceholder &&
        (!hasAllocatedPercent || showNoDataPlaceholder === true || isAllMode)
    ) {
        return <DiskBarLabel variant="placeholder">{noDataPlaceholder}</DiskBarLabel>;
    }

    return null;
}

interface GetPDiskBarIndicatorParams {
    hidden: boolean;
    icon?: DiskIndicatorValue;
    placement: 'inline' | 'overlap';
    severity: number;
    withIcon?: boolean;
}

function getPDiskBarIndicator({
    hidden,
    icon,
    placement,
    severity,
    withIcon,
}: GetPDiskBarIndicatorParams) {
    const resolvedIndicator = icon ?? getVDiskStatusIcon(severity, false);
    if (!withIcon || hidden || !resolvedIndicator) {
        return {
            leading: null,
            overflowVisible: false,
            showIndicator: false,
        };
    }

    return {
        leading: <DiskIndicator value={resolvedIndicator} placement={placement} />,
        overflowVisible: placement === 'overlap',
        showIndicator: true,
    };
}

function getAllModeOverlay(
    mode: DiskDisplayMode | undefined,
    indicators: PDiskAllModeIndicatorsState | undefined,
) {
    if (mode !== 'all') {
        return null;
    }

    return <PDiskAllModeIndicators indicators={indicators ?? EMPTY_ALL_MODE_INDICATORS} />;
}

function getAccessibleName(
    data: PreparedPDisk,
    allocatedPercent: number | undefined,
    hasIssues: boolean | undefined,
    isAllMode: boolean,
    showNoDataPlaceholder: boolean | undefined,
) {
    if (!isAllMode) {
        return undefined;
    }

    const noData = i18n('context_no-data');

    let allocated = noData;
    if (showNoDataPlaceholder !== true) {
        const hasAllocatedPercent =
            typeof allocatedPercent === 'number' &&
            Number.isFinite(allocatedPercent) &&
            allocatedPercent >= 0;

        if (hasAllocatedPercent) {
            allocated = `${Math.floor(allocatedPercent)}%`;
        }
    }

    const health =
        hasIssues === undefined
            ? noData
            : i18n(
                  hasIssues ? 'context_all-mode-health-issues' : 'context_all-mode-health-healthy',
              );
    const pDiskId =
        data.StringifiedId ??
        getPDiskId({
            nodeId: data.NodeId,
            pDiskId: data.PDiskId,
        }) ??
        noData;

    return i18n('context_all-mode-accessible-name', {
        pdiskId: pDiskId,
        health,
        state: data.State || noData,
        capacityAlert: data.PDiskCapacityAlert || noData,
        drive: data.DriveStatus || noData,
        decommit: data.DecommitStatus || noData,
        maintenance: data.MaintenanceStatus || noData,
        device: data.Device || noData,
        realtime: data.Realtime || noData,
        allocatedPercent: allocated,
    });
}

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
    const isAllMode = displayState.mode === 'all';
    const noDataPlaceholder =
        displayState.showNoDataPlaceholder === false ? undefined : i18n('context_no-data');
    const hideBarContent = Boolean(displayState.isLegendInactive);
    const allocatedPercent = displayState.allocatedPercent;
    const hasAllocatedPercent = isNumeric(allocatedPercent) && allocatedPercent >= 0;
    const iconPlacement = displayState.iconPlacement ?? 'inline';
    const accessibleName = getAccessibleName(
        data,
        allocatedPercent,
        displayState.allMode?.hasIssues,
        isAllMode,
        displayState.showNoDataPlaceholder,
    );
    const {leading, overflowVisible, showIndicator} = getPDiskBarIndicator({
        hidden: hideBarContent,
        icon: displayState.icon,
        placement: iconPlacement,
        severity: displayState.severity,
        withIcon,
    });
    const barContent = getPDiskBarContent({
        allocatedPercent,
        hidden: hideBarContent,
        isAllMode,
        noDataPlaceholder,
        showAllocatedPercentLabel: displayState.showAllocatedPercentLabel,
        showNoDataPlaceholder: displayState.showNoDataPlaceholder,
    });
    const overlay = getAllModeOverlay(displayState.mode, displayState.allMode?.indicators);

    const tone = getDiskBarTone({
        severity: displayState.severity,
        showIndicator,
        indicator: displayState.icon,
    });

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
                <InternalLink to={pDiskPath} aria-label={accessibleName} className={b('content')}>
                    <DiskStateProgressBar
                        allocation={allocatedPercent}
                        tone={tone}
                        mode={displayState.mode}
                        leading={leading}
                        content={barContent}
                        overlay={overlay}
                        className={progressBarClassName}
                        inactive={inactive}
                        highlighted={highlighted}
                        filled={hasAllocatedPercent && Number(allocatedPercent) > 0}
                        strongFill={displayState.allMode?.hasIssues}
                        borderless={displayState.isLegendInactive}
                        overflowVisible={overflowVisible}
                    />
                </InternalLink>
            </HoverPopup>
        </div>
    );
};
