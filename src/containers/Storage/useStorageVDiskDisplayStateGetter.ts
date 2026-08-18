import React from 'react';

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
import {getIconCalculator} from '../../utils/disks/getIconStrategy';
import {getSeverityCalculator} from '../../utils/disks/getSeverityStrategy';
import type {VDisksGroupByValue} from '../../utils/disks/groupBy';
import {VDisksGroupBy} from '../../utils/disks/groupBy';
import {
    calculateCompactionIcon,
    calculateFrontQueuesIcon,
    calculateSpaceIcon,
} from '../../utils/disks/iconCalculators';
import type {PreparedVDisk} from '../../utils/disks/types';

import {useSpaceLegendSelection} from './StorageExpertModePanel/components/useSpaceLegendSelection';
import {useIsStorageExpertMode, useVDisksGroupByParam} from './useStorageQueryParams';

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
        ...(compaction ? {compaction} : {}),
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
): VDiskDisplayState {
    const isAllMode = mode === 'all';
    const displayState: VDiskDisplayState = {
        severity: NOT_AVAILABLE_SEVERITY,
        icon: undefined,
        mode,
        isLegendInactive: false,
        showNoDataPlaceholder: true,
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

interface GetExpertVDiskDisplayStateParams {
    inactiveLegendItems: Set<ECapacityAlert>;
    isDonor?: boolean;
    vDisk: PreparedVDisk;
    vdisksGroupBy: VDisksGroupByValue;
}

function getExpertVDiskDisplayState({
    inactiveLegendItems,
    isDonor,
    vDisk,
    vdisksGroupBy,
}: GetExpertVDiskDisplayStateParams): VDiskDisplayState {
    const mode = getMode(vdisksGroupBy);
    if (!vDisk.VDiskId) {
        return getMissingVDiskDisplayState(vDisk, isDonor, mode);
    }

    const severity = getSeverityCalculator(vdisksGroupBy)(vDisk);
    const icon = getIconCalculator(vdisksGroupBy)(vDisk, isDonor);
    const isCapacityAlertInactive =
        isCapacityAlert(vDisk.CapacityAlert) && inactiveLegendItems.has(vDisk.CapacityAlert);
    const allMode = getAllModeDisplayState(mode, vDisk, isDonor, isCapacityAlertInactive);
    const displayState: VDiskDisplayState = {
        severity,
        icon,
        mode,
        isLegendInactive: mode === 'space' && isCapacityAlertInactive,
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

export function useStorageVDiskDisplayStateGetter(): VDiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const vdisksGroupBy = useVDisksGroupByParam();
    const inactiveLegendItems = useSpaceLegendSelection();

    return React.useCallback(
        (vDisk, isDonor) => {
            if (!isExpertMode) {
                return getDefaultDiskDisplayState(vDisk, isDonor);
            }

            return getExpertVDiskDisplayState({
                inactiveLegendItems,
                isDonor,
                vDisk,
                vdisksGroupBy,
            });
        },
        [inactiveLegendItems, isExpertMode, vdisksGroupBy],
    );
}
