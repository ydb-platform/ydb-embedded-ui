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
import type {SpaceLegendSelectionScope} from './StorageExpertModePanel/components/getSpaceLegendSelection';
import {useSpaceLegendSelection} from './StorageExpertModePanel/components/useSpaceLegendSelection';
import {PDisksGroupBy} from './StorageExpertModePanel/constants';
import type {PDisksGroupByValue} from './StorageExpertModePanel/constants';
import {
    useIsStorageExpertMode,
    useNodesPDisksGroupByParam,
    usePDisksGroupByParam,
} from './useStorageQueryParams';

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
    hasWhiteboardData = true,
): PDiskAllModeIndicatorsState {
    const capacityAlertIcon = isCapacityAlertInactive
        ? undefined
        : calculateSpaceIcon({CapacityAlert: pDisk.PDiskCapacityAlert});
    const driveIcon = getBSCStatusDisplayState(pDisk, 'drive', hasWhiteboardData)?.icon;
    const decommitIcon = getBSCStatusDisplayState(pDisk, 'decommit', hasWhiteboardData)?.icon;
    const maintenanceIcon = getBSCStatusDisplayState(pDisk, 'maintenance', hasWhiteboardData)?.icon;
    const deviceIcon = calculateFlagPairIcon(pDisk.Device, pDisk.Realtime);

    return {
        ...(capacityAlertIcon && (hasWhiteboardData || isCapacityAlert(pDisk.PDiskCapacityAlert))
            ? {capacityAlert: capacityAlertIcon}
            : {}),
        ...(driveIcon ? {drive: driveIcon} : {}),
        ...(decommitIcon ? {decommit: decommitIcon} : {}),
        ...(maintenanceIcon ? {maintenance: maintenanceIcon} : {}),
        ...(deviceIcon && hasWhiteboardData ? {device: deviceIcon} : {}),
    };
}

function getMissingPDiskDisplayState(
    pDisk: Parameters<PDiskDisplayStateGetter>[0],
    mode: DiskDisplayMode | undefined,
    inactiveAlerts: Set<ECapacityAlert>,
): PDiskDisplayState {
    const isCapacityAlertInactive =
        isCapacityAlert(pDisk.PDiskCapacityAlert) && inactiveAlerts.has(pDisk.PDiskCapacityAlert);
    let icon: PDiskDisplayState['icon'] = getBSCStatusDisplayState(pDisk, mode, false)?.icon;
    if (mode === 'space' && isCapacityAlert(pDisk.PDiskCapacityAlert) && !isCapacityAlertInactive) {
        icon = calculateSpaceIcon({CapacityAlert: pDisk.PDiskCapacityAlert});
    }

    return {
        severity: NOT_AVAILABLE_SEVERITY,
        icon,
        mode,
        isNoData: true,
        isLegendInactive: false,
        showNoDataPlaceholder: true,
        allocatedPercent:
            mode === 'all' || mode === 'space' ? getAllocatedPercent(pDisk) : undefined,
        showAllocatedPercentLabel: mode !== 'all',
        iconPlacement: 'inline',
        width: mode === 'all' ? EXPERT_MODE_ALL_PDISK_WIDTH : EXPERT_MODE_PDISK_WIDTH,
        ...(mode === 'all'
            ? {allMode: {indicators: getAllModeIndicators(pDisk, isCapacityAlertInactive, false)}}
            : {}),
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

function getBSCStatusDisplayState(
    pDisk: Parameters<PDiskDisplayStateGetter>[0],
    mode: DiskDisplayMode | undefined,
    hasWhiteboardData: boolean,
) {
    let status: string | undefined;
    let displayState: ReturnType<typeof getPDiskDriveDisplayState>;

    switch (mode) {
        case 'drive':
            status = pDisk.DriveStatus;
            displayState = getPDiskDriveDisplayState(pDisk.DriveStatus);
            break;
        case 'decommit':
            status = pDisk.DecommitStatus;
            displayState = getPDiskDecommitDisplayState(pDisk.DecommitStatus);
            break;
        case 'maintenance':
            status = pDisk.MaintenanceStatus;
            displayState = getPDiskMaintenanceDisplayState(pDisk.MaintenanceStatus);
            break;
        default:
            return undefined;
    }

    return {
        ...displayState,
        icon: status === undefined && hasWhiteboardData ? CircleQuestionFill : displayState.icon,
    };
}

function usePDiskDisplayStateGetter(
    pdisksGroupBy: PDisksGroupByValue,
    selectionScope: SpaceLegendSelectionScope,
): PDiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const inactiveAlerts = useSpaceLegendSelection(selectionScope);

    return React.useCallback(
        (pDisk) => {
            if (!isExpertMode) {
                return getDefaultPDiskDisplayState(pDisk);
            }

            const mode = getMode(pdisksGroupBy);
            const hasWhiteboardData = pDisk.HasWhiteboardData ?? pDisk.WhiteboardSize !== undefined;

            if (!hasWhiteboardData) {
                return getMissingPDiskDisplayState(pDisk, mode, inactiveAlerts);
            }

            const allocatedPercent = getAllocatedPercent(pDisk);

            if (pdisksGroupBy === PDisksGroupBy.Space) {
                const capacityAlert = pDisk.PDiskCapacityAlert;
                const isCapacityAlertInactive =
                    isCapacityAlert(capacityAlert) && inactiveAlerts.has(capacityAlert);

                return {
                    severity: calculateSpaceSeverity({CapacityAlert: capacityAlert}),
                    icon: calculateSpaceIcon({CapacityAlert: capacityAlert}),
                    mode,
                    isLegendInactive: isCapacityAlertInactive,
                    borderless: isCapacityAlertInactive,
                    showNoDataPlaceholder: false,
                    allocatedPercent,
                    width: EXPERT_MODE_PDISK_WIDTH,
                };
            }

            if (pdisksGroupBy === PDisksGroupBy.All) {
                return getAllModeDisplayState(pDisk, inactiveAlerts);
            }

            const statusDisplayState = getBSCStatusDisplayState(pDisk, mode, hasWhiteboardData);

            if (statusDisplayState) {
                return {
                    ...statusDisplayState,
                    mode,
                    isLegendInactive: false,
                    showNoDataPlaceholder: false,
                    allocatedPercent: undefined,
                    width: EXPERT_MODE_PDISK_WIDTH,
                };
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

export function useStoragePDiskDisplayStateGetter(): PDiskDisplayStateGetter {
    const pdisksGroupBy = usePDisksGroupByParam();

    return usePDiskDisplayStateGetter(pdisksGroupBy, 'pdisks');
}

export function useStorageNodesPDiskDisplayStateGetter(): PDiskDisplayStateGetter {
    const pdisksGroupBy = useNodesPDisksGroupByParam();

    return usePDiskDisplayStateGetter(pdisksGroupBy, 'nodes-pdisks');
}
