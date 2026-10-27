import React from 'react';

import {CircleXmarkFill, ClockFill} from '@gravity-ui/icons';

import {ECapacityAlert, EFlag, isCapacityAlert} from '../../types/api/enums';
import {EVDiskState} from '../../types/api/vdisk';
import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
} from '../../utils/disks/constants';
import type {
    AllModeDisplayState,
    AllModeIndicatorsState,
    DiskDisplayMode,
    VDiskDisplayState,
    VDiskDisplayStateGetter,
} from '../../utils/disks/displayState';
import {getDefaultDiskDisplayState} from '../../utils/disks/displayState';
import {getDriveTypeDisplayState} from '../../utils/disks/driveType';
import {getIconCalculator} from '../../utils/disks/getIconStrategy';
import {getSeverityCalculator} from '../../utils/disks/getSeverityStrategy';
import type {VDisksGroupByValue} from '../../utils/disks/groupBy';
import {VDisksGroupBy} from '../../utils/disks/groupBy';
import {
    calculateCompactionIcon,
    calculateFrontQueuesIcon,
    calculateSpaceIcon,
    calculateStateIcon,
} from '../../utils/disks/iconCalculators';
import type {PreparedVDisk} from '../../utils/disks/types';

import type {SpaceLegendSelectionScope} from './StorageExpertModePanel/components/getSpaceLegendSelection';
import {useSpaceLegendSelection} from './StorageExpertModePanel/components/useSpaceLegendSelection';
import {
    useIsStorageExpertMode,
    useNodesVDisksGroupByParam,
    useVDisksGroupByParam,
} from './useStorageQueryParams';

function getMode(groupBy: VDisksGroupByValue): DiskDisplayMode {
    switch (groupBy) {
        case VDisksGroupBy.State:
            return 'state';
        case VDisksGroupBy.Space:
            return 'space';
        case VDisksGroupBy.FrontQueues:
            return 'frontQueues';
        case VDisksGroupBy.Compaction:
            return 'compaction';
        case VDisksGroupBy.All:
        default:
            return 'all';
    }
}

function isAllModeHealthy(vDisk: PreparedVDisk) {
    return (
        vDisk.VDiskState === EVDiskState.OK &&
        vDisk.CapacityAlert === ECapacityAlert.GREEN &&
        vDisk.FrontQueues === EFlag.Green &&
        vDisk.SatisfactionRank?.FreshRank?.Flag === EFlag.Green &&
        vDisk.SatisfactionRank?.LevelRank?.Flag === EFlag.Green
    );
}

function getAllModeIndicators(
    vDisk: PreparedVDisk,
    isDonor: boolean | undefined,
    isCapacityAlertInactive: boolean,
): AllModeIndicatorsState {
    if (isDonor) {
        return {};
    }

    const capacityAlert = isCapacityAlertInactive ? undefined : calculateSpaceIcon(vDisk, isDonor);
    const frontQueues = calculateFrontQueuesIcon(vDisk, isDonor);
    const calculatedCompaction = calculateCompactionIcon(vDisk, isDonor);
    const compaction = Array.isArray(calculatedCompaction) ? calculatedCompaction : undefined;

    return {
        ...(capacityAlert ? {capacityAlert} : {}),
        ...(frontQueues ? {frontQueues} : {}),
        ...(compaction?.length ? {compaction} : {}),
    };
}

function getAllModeDisplayState(
    mode: DiskDisplayMode,
    vDisk: PreparedVDisk,
    isDonor: boolean | undefined,
    isCapacityAlertInactive: boolean,
): AllModeDisplayState | undefined {
    if (mode !== 'all') {
        return undefined;
    }

    return {
        hasIssues: !isAllModeHealthy(vDisk),
        indicators: getAllModeIndicators(vDisk, isDonor, isCapacityAlertInactive),
    };
}

function isVDiskReplicating(mode: DiskDisplayMode, severity: number, vDisk: PreparedVDisk) {
    if (mode === 'state' || mode === 'all') {
        return severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue;
    }

    return Boolean(vDisk.VDiskState) && vDisk.Replicated === false;
}

function getMissingVDiskDisplayState(
    vDisk: PreparedVDisk,
    isDonor: boolean | undefined,
    mode: DiskDisplayMode,
    showNoDataPlaceholder: boolean,
): VDiskDisplayState {
    const isAllMode = mode === 'all';
    let icon: VDiskDisplayState['icon'];
    if (isDonor) {
        icon = calculateStateIcon(vDisk, isDonor);
    } else if (mode === 'state' || isAllMode) {
        icon = getKnownVDiskStateIcon(vDisk);
    }
    const displayState: VDiskDisplayState = {
        severity: NOT_AVAILABLE_SEVERITY,
        icon,
        mode,
        isNoData: true,
        isLegendInactive: false,
        showNoDataPlaceholder,
        allocatedPercent: isAllMode ? vDisk.AllocatedPercent : undefined,
        showAllocatedPercentLabel: !isAllMode,
        striped: Boolean(isDonor),
        iconPlacement: 'inline',
    };

    if (isAllMode) {
        displayState.allMode = {indicators: {}};
    }

    return displayState;
}

function getKnownVDiskStateIcon(vDisk: PreparedVDisk) {
    if (vDisk.VDiskState !== undefined) {
        return calculateStateIcon(vDisk);
    }

    switch (vDisk.Status) {
        case 'ERROR':
            return CircleXmarkFill;
        case 'INIT_PENDING':
            return ClockFill;
        default:
            return undefined;
    }
}

interface GetExpertVDiskDisplayStateParams {
    inactiveLegendItems: Set<ECapacityAlert>;
    isDonor?: boolean;
    selectionScope: SpaceLegendSelectionScope;
    vDisk: PreparedVDisk;
    vdisksGroupBy: VDisksGroupByValue;
}

function getExpertVDiskDisplayState({
    inactiveLegendItems,
    isDonor,
    selectionScope,
    vDisk,
    vdisksGroupBy,
}: GetExpertVDiskDisplayStateParams): VDiskDisplayState {
    const hasWhiteboardData = vDisk.HasWhiteboardData ?? Boolean(vDisk.VDiskId);
    if (vdisksGroupBy === VDisksGroupBy.DriveType) {
        return {
            ...getDriveTypeDisplayState(hasWhiteboardData ? vDisk.PDisk : undefined),
            striped: false,
            iconPlacement: 'inline',
        };
    }

    const mode = getMode(vdisksGroupBy);
    if (!hasWhiteboardData) {
        return getMissingVDiskDisplayState(vDisk, isDonor, mode, selectionScope !== 'nodes-vdisks');
    }

    const severity = getSeverityCalculator(vdisksGroupBy)(vDisk);
    const icon = getIconCalculator(vdisksGroupBy)(vDisk, isDonor);
    const isCapacityAlertInactive =
        isCapacityAlert(vDisk.CapacityAlert) && inactiveLegendItems.has(vDisk.CapacityAlert);
    const allMode = getAllModeDisplayState(mode, vDisk, isDonor, isCapacityAlertInactive);
    const spaceBorderless = mode === 'space' && isCapacityAlertInactive;
    const stateBorderless =
        mode === 'state' &&
        !isDonor &&
        (severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Green ||
            severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Yellow);
    const displayState: VDiskDisplayState = {
        severity,
        icon,
        mode,
        isLegendInactive: mode === 'space' && isCapacityAlertInactive,
        borderless: spaceBorderless || stateBorderless,
        showNoDataPlaceholder: false,
        allocatedPercent: mode === 'all' ? vDisk.AllocatedPercent : undefined,
        showAllocatedPercentLabel: mode !== 'all',
        striped: isVDiskReplicating(mode, severity, vDisk) || Boolean(isDonor),
        iconPlacement: mode === 'all' && !isDonor && Boolean(icon) ? 'overlap' : 'inline',
    };

    if (allMode) {
        displayState.allMode = allMode;
    }

    return displayState;
}

function useVDiskDisplayStateGetter(
    vdisksGroupBy: VDisksGroupByValue,
    selectionScope: SpaceLegendSelectionScope,
): VDiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const inactiveLegendItems = useSpaceLegendSelection(selectionScope);

    return React.useCallback(
        (vDisk, isDonor) => {
            if (!isExpertMode) {
                return getDefaultDiskDisplayState(vDisk, isDonor);
            }

            return getExpertVDiskDisplayState({
                inactiveLegendItems,
                isDonor,
                selectionScope,
                vDisk,
                vdisksGroupBy,
            });
        },
        [inactiveLegendItems, isExpertMode, selectionScope, vdisksGroupBy],
    );
}

export function useStorageVDiskDisplayStateGetter(): VDiskDisplayStateGetter {
    const vdisksGroupBy = useVDisksGroupByParam();

    return useVDiskDisplayStateGetter(vdisksGroupBy, 'vdisks');
}

export function useStorageNodesVDiskDisplayStateGetter(): VDiskDisplayStateGetter {
    const vdisksGroupBy = useNodesVDisksGroupByParam();

    return useVDiskDisplayStateGetter(vdisksGroupBy, 'nodes-vdisks');
}
