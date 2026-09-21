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
import {isCapacityAlert} from '../../../types/api/enums';
import {cn} from '../../../utils/cn';
import {EMPTY_DATA_PLACEHOLDER} from '../../../utils/constants';
import type {
    DiskIndicatorValue,
    PDiskDisplayState,
    PDiskDisplayStateGetter,
} from '../../../utils/disks/displayState';
import {getDefaultPDiskDisplayState} from '../../../utils/disks/displayState';
import {getDiskBarTone} from '../../../utils/disks/getDiskBarTone';
import {getPDiskId, getVDiskStatusIcon} from '../../../utils/disks/helpers';
import type {PreparedPDisk} from '../../../utils/disks/types';
import {isNumeric} from '../../../utils/utils';
import {DISKS_POPUP_DEBOUNCE_TIMEOUT} from '../shared';

import {i18n} from './i18n';

import './PDisk.scss';

const b = cn('pdisk-storage');
const EMPTY_ALL_MODE_INDICATORS = {};

interface PDiskNodeBarContentProps {
    left?: React.ReactNode;
    center?: React.ReactNode;
    type?: React.ReactNode;
}

function PDiskNodeBarContent({left, center, type}: PDiskNodeBarContentProps) {
    return (
        <div className={b('node-bar-content')}>
            <div className={b('node-bar-left')}>{left}</div>
            <div className={b('node-bar-center')}>{center}</div>
            <div className={b('node-bar-type')}>{type}</div>
        </div>
    );
}

interface GetPDiskContentParams {
    barContent: React.ReactNode;
    data: PreparedPDisk;
    hasIndicators: boolean;
    showAllocatedPercentLabel: boolean;
    showTypeLabel?: boolean;
    isNoData?: boolean;
}

function getPDiskContent({
    barContent,
    data,
    hasIndicators,
    showAllocatedPercentLabel,
    showTypeLabel,
    isNoData,
}: GetPDiskContentParams) {
    if (!showTypeLabel) {
        return barContent;
    }

    const showNoDataLabel = isNoData && !showAllocatedPercentLabel;

    return (
        <PDiskNodeBarContent
            left={hasIndicators || showAllocatedPercentLabel || showNoDataLabel ? null : barContent}
            center={showAllocatedPercentLabel ? barContent : null}
            type={
                <React.Fragment>
                    {showNoDataLabel ? barContent : null}
                    <DiskBarLabel>{data.Type || EMPTY_DATA_PLACEHOLDER}</DiskBarLabel>
                </React.Fragment>
            }
        />
    );
}

interface GetPDiskBarContentParams {
    allocatedPercent?: number;
    isAllMode: boolean;
    noDataPlaceholder?: React.ReactNode;
    showAllocatedPercentLabel?: boolean;
    showNoDataPlaceholder?: boolean;
}

function getPDiskBarContent({
    allocatedPercent,
    isAllMode,
    noDataPlaceholder,
    showAllocatedPercentLabel,
    showNoDataPlaceholder,
}: GetPDiskBarContentParams) {
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

function getAccessiblePDiskId(data: PreparedPDisk) {
    return (
        data.StringifiedId ||
        getPDiskId({nodeId: data.NodeId, pDiskId: data.PDiskId}) ||
        i18n('context_no-data')
    );
}

function getAllocatedPercentAccessibleName(allocatedPercent: number | undefined) {
    const hasAllocatedPercent =
        typeof allocatedPercent === 'number' &&
        Number.isFinite(allocatedPercent) &&
        allocatedPercent >= 0;

    return hasAllocatedPercent ? `${Math.floor(allocatedPercent)}%` : i18n('context_no-data');
}

function getAllModeAccessibleName(
    data: PreparedPDisk,
    allocatedPercent: number | undefined,
    hasIssues: boolean | undefined,
) {
    const noData = i18n('context_no-data');
    const health =
        hasIssues === undefined
            ? noData
            : i18n(
                  hasIssues ? 'context_all-mode-health-issues' : 'context_all-mode-health-healthy',
              );
    return i18n('context_all-mode-accessible-name', {
        pdiskId: getAccessiblePDiskId(data),
        health,
        state: data.State || noData,
        capacityAlert: data.PDiskCapacityAlert || noData,
        drive: data.DriveStatus || noData,
        decommit: data.DecommitStatus || noData,
        maintenance: data.MaintenanceStatus || noData,
        device: data.Device || noData,
        realtime: data.Realtime || noData,
        allocatedPercent: getAllocatedPercentAccessibleName(allocatedPercent),
    });
}

function getAccessibleName(
    data: PreparedPDisk,
    {mode, allMode, isNoData, allocatedPercent, driveType}: PDiskDisplayState,
) {
    if (!mode) {
        return undefined;
    }
    if (mode === 'all') {
        return getAllModeAccessibleName(data, allocatedPercent, allMode?.hasIssues);
    }

    const noData = i18n('context_no-data');
    let diskName = i18n('context_pdisk', {pdiskId: getAccessiblePDiskId(data)});
    if (isNoData) {
        diskName = i18n('context_pdisk-no-whiteboard', {disk: diskName, noData});
    }
    const {State, Device, Realtime} = isNoData ? {} : data;

    switch (mode) {
        case 'driveType':
            return i18n('context_drive-type-accessible-name', {
                disk: diskName,
                driveType: driveType || noData,
            });
        case 'state':
            return i18n('context_state-accessible-name', {disk: diskName, state: State || noData});
        case 'space':
            return i18n('context_space-accessible-name', {
                disk: diskName,
                capacityAlert: isCapacityAlert(data.PDiskCapacityAlert)
                    ? data.PDiskCapacityAlert
                    : noData,
                allocatedPercent: getAllocatedPercentAccessibleName(allocatedPercent),
            });
        case 'drive':
            return i18n('context_drive-accessible-name', {
                disk: diskName,
                drive: data.DriveStatus || noData,
            });
        case 'decommit':
            return i18n('context_decommit-accessible-name', {
                disk: diskName,
                decommit: data.DecommitStatus || noData,
            });
        case 'maintenance':
            return i18n('context_maintenance-accessible-name', {
                disk: diskName,
                maintenance: data.MaintenanceStatus || noData,
            });
        case 'device':
            return i18n('context_device-accessible-name', {
                disk: diskName,
                device: Device || noData,
                realtime: Realtime || noData,
            });
        default:
            return undefined;
    }
}

export interface PDiskProps {
    data?: PreparedPDisk;
    showPopup?: boolean;
    onShowPopup?: VoidFunction;
    onHidePopup?: VoidFunction;
    className?: string;
    progressBarClassName?: string;
    // Nodes derive this width from their VDisk rows, overriding the Groups mode defaults.
    width?: number;
    delayOpen?: number;
    delayClose?: number;
    withIcon?: boolean;
    showTypeLabel?: boolean;
    inactive?: boolean;
    highlighted?: boolean;
    getDisplayState?: PDiskDisplayStateGetter;
    topContent?: React.ReactNode;
}

export const PDisk = ({
    data = {},
    showPopup,
    onShowPopup,
    onHidePopup,
    className,
    progressBarClassName,
    width,
    delayOpen = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    delayClose = DISKS_POPUP_DEBOUNCE_TIMEOUT,
    withIcon,
    showTypeLabel,
    inactive,
    highlighted,
    getDisplayState,
    topContent,
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
    const allocatedPercent = displayState.allocatedPercent;
    const hasAllocatedPercent = isNumeric(allocatedPercent) && allocatedPercent >= 0;
    const iconPlacement = displayState.iconPlacement ?? 'inline';
    const accessibleName = getAccessibleName(data, displayState);
    const {leading, overflowVisible, showIndicator} = getPDiskBarIndicator({
        hidden: Boolean(displayState.isLegendInactive),
        icon: displayState.icon,
        placement: iconPlacement,
        severity: displayState.severity,
        withIcon,
    });
    const barContent = getPDiskBarContent({
        allocatedPercent,
        isAllMode,
        noDataPlaceholder,
        showAllocatedPercentLabel: displayState.showAllocatedPercentLabel,
        showNoDataPlaceholder: displayState.showNoDataPlaceholder,
    });
    const showAllocatedPercentLabel =
        hasAllocatedPercent && displayState.showAllocatedPercentLabel !== false;
    const allModeIndicators = displayState.allMode?.indicators ?? EMPTY_ALL_MODE_INDICATORS;
    const hasAllModeIndicators = isAllMode && Object.values(allModeIndicators).some(Boolean);
    const overlay = hasAllModeIndicators ? (
        <PDiskAllModeIndicators indicators={allModeIndicators} />
    ) : null;
    const content = getPDiskContent({
        barContent,
        data,
        hasIndicators: showIndicator || hasAllModeIndicators,
        showAllocatedPercentLabel,
        showTypeLabel,
        isNoData: displayState.isNoData,
    });

    const tone = getDiskBarTone({
        driveType: displayState.driveType,
        severity: displayState.severity,
        showIndicator,
        indicator: displayState.icon,
        isNoData: displayState.isNoData,
    });

    let pDiskPath: string | undefined;

    if (pDiskIdsDefined) {
        pDiskPath = getPDiskPagePath(PDiskId, NodeId);
    }

    return (
        <div
            className={b(null, className)}
            ref={anchorRef}
            style={{width: width ?? displayState.width}}
        >
            {topContent}
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
                        content={content}
                        overlay={overlay}
                        className={progressBarClassName}
                        inactive={inactive}
                        highlighted={highlighted}
                        filled={hasAllocatedPercent && Number(allocatedPercent) > 0}
                        strongFill={displayState.allMode?.hasIssues}
                        borderless={displayState.borderless}
                        overflowVisible={overflowVisible}
                    />
                </InternalLink>
            </HoverPopup>
        </div>
    );
};
