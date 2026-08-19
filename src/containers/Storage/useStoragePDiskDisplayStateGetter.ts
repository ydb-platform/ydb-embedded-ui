import React from 'react';

import {CircleQuestionFill} from '@gravity-ui/icons';

import {ECapacityAlert, EFlag, isCapacityAlert} from '../../types/api/enums';
import {TPDiskState} from '../../types/api/pdisk';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {
    DiskDisplayMode,
    PDiskAllModeIndicatorsState,
    PDiskDisplayState,
    PDiskDisplayStateGetter,
} from '../../utils/disks/displayState';
import {getDefaultPDiskDisplayState} from '../../utils/disks/displayState';
import {calculateFlagPairIcon, calculateSpaceIcon} from '../../utils/disks/iconCalculators';
import {
    getPDiskDecommitDisplayState,
    getPDiskDriveDisplayState,
    getPDiskMaintenanceDisplayState,
    getPDiskStateDisplayState,
} from '../../utils/disks/pdiskState';
import {
    calculateFlagPairSeverity,
    calculateSpaceSeverity,
} from '../../utils/disks/severityCalculators';

import {EXPERT_MODE_ALL_PDISK_WIDTH, EXPERT_MODE_PDISK_WIDTH} from './Disks/constants';
import {useSpaceLegendSelection} from './StorageExpertModePanel/components/useSpaceLegendSelection';
import {PDisksGroupBy} from './StorageExpertModePanel/constants';
import type {PDisksGroupByValue} from './StorageExpertModePanel/constants';
import {useIsStorageExpertMode, usePDisksGroupByParam} from './useStorageQueryParams';

function getMode(groupBy: PDisksGroupByValue): DiskDisplayMode | undefined {
    switch (groupBy) {
        case PDisksGroupBy.State:
            return 'state';
        case PDisksGroupBy.Space:
            return 'space';
        case PDisksGroupBy.Drive:
            return 'drive';
        case PDisksGroupBy.Decommit:
            return 'decommit';
        case PDisksGroupBy.Maintenance:
            return 'maintenance';
        case PDisksGroupBy.Device:
            return 'device';
        case PDisksGroupBy.All:
            return 'all';
        default:
            return undefined;
    }
}

function requiresWhiteboardData(groupBy: PDisksGroupByValue) {
    return groupBy === PDisksGroupBy.State || groupBy === PDisksGroupBy.Device;
}

function hasBSCStatusData(pDisk: Parameters<PDiskDisplayStateGetter>[0]) {
    return (
        pDisk.DriveStatus !== undefined ||
        pDisk.DecommitStatus !== undefined ||
        pDisk.MaintenanceStatus !== undefined
    );
}

function getAllocatedPercent(pDisk: Parameters<PDiskDisplayStateGetter>[0]) {
    const whiteboardAllocatedPercent = pDisk.WhiteboardSize?.AllocatedPercent;

    return typeof whiteboardAllocatedPercent === 'number' &&
        Number.isFinite(whiteboardAllocatedPercent)
        ? whiteboardAllocatedPercent
        : pDisk.AllocatedPercent;
}

function isAllModeHealthy(pDisk: Parameters<PDiskDisplayStateGetter>[0]) {
    return (
        pDisk.State === TPDiskState.Normal &&
        pDisk.PDiskCapacityAlert === ECapacityAlert.GREEN &&
        pDisk.DriveStatus === 'ACTIVE' &&
        pDisk.DecommitStatus === 'DECOMMIT_NONE' &&
        pDisk.MaintenanceStatus === 'NO_REQUEST' &&
        pDisk.Device === EFlag.Green &&
        pDisk.Realtime === EFlag.Green
    );
}

function getAllModeIndicators(
    pDisk: Parameters<PDiskDisplayStateGetter>[0],
    isCapacityAlertInactive: boolean,
): PDiskAllModeIndicatorsState {
    const capacityAlertIcon = isCapacityAlertInactive
        ? undefined
        : calculateSpaceIcon({CapacityAlert: pDisk.PDiskCapacityAlert});
    const driveDisplayState = getPDiskDriveDisplayState(pDisk.DriveStatus);
    const decommitDisplayState = getPDiskDecommitDisplayState(pDisk.DecommitStatus);
    const maintenanceDisplayState = getPDiskMaintenanceDisplayState(pDisk.MaintenanceStatus);
    const deviceIcon = calculateFlagPairIcon(pDisk.Device, pDisk.Realtime);
    const driveIcon = pDisk.DriveStatus === undefined ? CircleQuestionFill : driveDisplayState.icon;
    const decommitIcon =
        pDisk.DecommitStatus === undefined ? CircleQuestionFill : decommitDisplayState.icon;
    const maintenanceIcon =
        pDisk.MaintenanceStatus === undefined ? CircleQuestionFill : maintenanceDisplayState.icon;

    return {
        ...(capacityAlertIcon ? {capacityAlert: capacityAlertIcon} : {}),
        ...(driveIcon ? {drive: driveIcon} : {}),
        ...(decommitIcon ? {decommit: decommitIcon} : {}),
        ...(maintenanceIcon ? {maintenance: maintenanceIcon} : {}),
        ...(deviceIcon ? {device: deviceIcon} : {}),
    };
}

function getMissingAllModeDisplayState(
    pDisk: Parameters<PDiskDisplayStateGetter>[0],
): PDiskDisplayState {
    return {
        severity: NOT_AVAILABLE_SEVERITY,
        icon: undefined,
        mode: 'all',
        isLegendInactive: false,
        showNoDataPlaceholder: true,
        allocatedPercent: getAllocatedPercent(pDisk),
        showAllocatedPercentLabel: false,
        iconPlacement: 'inline',
        width: EXPERT_MODE_ALL_PDISK_WIDTH,
        allMode: {indicators: {}},
    };
}

function getAllModeDisplayState(
    pDisk: Parameters<PDiskDisplayStateGetter>[0],
    inactiveAlerts: Set<ECapacityAlert>,
): PDiskDisplayState {
    const stateDisplayState = getPDiskStateDisplayState(pDisk.State);
    const allocatedPercent = getAllocatedPercent(pDisk);
    const isCapacityAlertInactive =
        isCapacityAlert(pDisk.PDiskCapacityAlert) && inactiveAlerts.has(pDisk.PDiskCapacityAlert);
    const icon =
        stateDisplayState.severity === NOT_AVAILABLE_SEVERITY
            ? CircleQuestionFill
            : stateDisplayState.icon;

    return {
        ...stateDisplayState,
        icon,
        mode: 'all',
        isLegendInactive: false,
        showNoDataPlaceholder: false,
        allocatedPercent,
        showAllocatedPercentLabel: false,
        iconPlacement: icon ? 'overlap' : 'inline',
        width: EXPERT_MODE_ALL_PDISK_WIDTH,
        allMode: {
            hasIssues: !isAllModeHealthy(pDisk),
            indicators: getAllModeIndicators(pDisk, isCapacityAlertInactive),
        },
    };
}

function getMissingStatusDisplayState(mode: DiskDisplayMode | undefined): PDiskDisplayState {
    return {
        severity: NOT_AVAILABLE_SEVERITY,
        icon: undefined,
        mode,
        isLegendInactive: false,
        showNoDataPlaceholder: true,
        allocatedPercent: undefined,
        width: mode ? EXPERT_MODE_PDISK_WIDTH : undefined,
    };
}

interface GetStatusModeDisplayStateParams {
    hasWhiteboardData: boolean;
    mode: DiskDisplayMode | undefined;
    pDisk: Parameters<PDiskDisplayStateGetter>[0];
    pdisksGroupBy: PDisksGroupByValue;
}

function getStatusModeDisplayState({
    hasWhiteboardData,
    mode,
    pDisk,
    pdisksGroupBy,
}: GetStatusModeDisplayStateParams): PDiskDisplayState | undefined {
    if (pdisksGroupBy === PDisksGroupBy.Drive) {
        if (!hasWhiteboardData && pDisk.DriveStatus === undefined) {
            return getMissingStatusDisplayState(mode);
        }

        const driveDisplayState = getPDiskDriveDisplayState(pDisk.DriveStatus);

        return {
            ...driveDisplayState,
            icon: pDisk.DriveStatus === undefined ? CircleQuestionFill : driveDisplayState.icon,
            mode,
            isLegendInactive: false,
            showNoDataPlaceholder: false,
            allocatedPercent: undefined,
            width: EXPERT_MODE_PDISK_WIDTH,
        };
    }

    if (pdisksGroupBy === PDisksGroupBy.Decommit) {
        if (!hasWhiteboardData && pDisk.DecommitStatus === undefined) {
            return getMissingStatusDisplayState(mode);
        }

        const decommitDisplayState = getPDiskDecommitDisplayState(pDisk.DecommitStatus);

        return {
            ...decommitDisplayState,
            icon:
                pDisk.DecommitStatus === undefined ? CircleQuestionFill : decommitDisplayState.icon,
            mode,
            isLegendInactive: false,
            showNoDataPlaceholder: false,
            allocatedPercent: undefined,
            width: EXPERT_MODE_PDISK_WIDTH,
        };
    }

    if (pdisksGroupBy === PDisksGroupBy.Maintenance) {
        if (!hasWhiteboardData && pDisk.MaintenanceStatus === undefined) {
            return getMissingStatusDisplayState(mode);
        }

        const maintenanceDisplayState = getPDiskMaintenanceDisplayState(pDisk.MaintenanceStatus);

        return {
            ...maintenanceDisplayState,
            icon:
                pDisk.MaintenanceStatus === undefined
                    ? CircleQuestionFill
                    : maintenanceDisplayState.icon,
            mode,
            isLegendInactive: false,
            showNoDataPlaceholder: false,
            allocatedPercent: undefined,
            width: EXPERT_MODE_PDISK_WIDTH,
        };
    }

    return undefined;
}

export function useStoragePDiskDisplayStateGetter(): PDiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const pdisksGroupBy = usePDisksGroupByParam();
    const inactiveAlerts = useSpaceLegendSelection('pdisks');

    return React.useCallback(
        (pDisk) => {
            if (!isExpertMode) {
                return getDefaultPDiskDisplayState(pDisk);
            }

            const mode = getMode(pdisksGroupBy);
            const hasWhiteboardData = pDisk.WhiteboardSize !== undefined;

            if (
                pdisksGroupBy === PDisksGroupBy.All &&
                !hasWhiteboardData &&
                !hasBSCStatusData(pDisk)
            ) {
                return getMissingAllModeDisplayState(pDisk);
            }

            if (!hasWhiteboardData && requiresWhiteboardData(pdisksGroupBy)) {
                return getMissingStatusDisplayState(mode);
            }

            const allocatedPercent = getAllocatedPercent(pDisk);

            if (pdisksGroupBy === PDisksGroupBy.Space) {
                const capacityAlert = pDisk.PDiskCapacityAlert;

                return {
                    severity: calculateSpaceSeverity({CapacityAlert: capacityAlert}),
                    icon: calculateSpaceIcon({CapacityAlert: capacityAlert}),
                    mode,
                    isLegendInactive:
                        isCapacityAlert(capacityAlert) && inactiveAlerts.has(capacityAlert),
                    showNoDataPlaceholder: false,
                    allocatedPercent,
                    width: EXPERT_MODE_PDISK_WIDTH,
                };
            }

            if (pdisksGroupBy === PDisksGroupBy.All) {
                return getAllModeDisplayState(pDisk, inactiveAlerts);
            }

            const statusDisplayState = getStatusModeDisplayState({
                hasWhiteboardData,
                mode,
                pDisk,
                pdisksGroupBy,
            });

            if (statusDisplayState) {
                return statusDisplayState;
            }

            if (pdisksGroupBy === PDisksGroupBy.Device) {
                return {
                    severity: calculateFlagPairSeverity(pDisk.Device, pDisk.Realtime),
                    icon: calculateFlagPairIcon(pDisk.Device, pDisk.Realtime),
                    mode,
                    isLegendInactive: false,
                    showNoDataPlaceholder: false,
                    allocatedPercent: undefined,
                    width: EXPERT_MODE_PDISK_WIDTH,
                };
            }

            if (pdisksGroupBy !== PDisksGroupBy.State) {
                return getDefaultPDiskDisplayState(pDisk);
            }

            const stateDisplayState = getPDiskStateDisplayState(pDisk.State);

            return {
                ...stateDisplayState,
                icon:
                    stateDisplayState.severity === NOT_AVAILABLE_SEVERITY
                        ? CircleQuestionFill
                        : stateDisplayState.icon,
                mode,
                isLegendInactive: false,
                showNoDataPlaceholder: false,
                allocatedPercent: undefined,
                width: EXPERT_MODE_PDISK_WIDTH,
            };
        },
        [inactiveAlerts, isExpertMode, pdisksGroupBy],
    );
}
