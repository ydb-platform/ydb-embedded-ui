import React from 'react';

import {CircleQuestionFill} from '@gravity-ui/icons';

import {isCapacityAlert} from '../../types/api/enums';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {PDiskDisplayStateGetter} from '../../utils/disks/displayState';
import {getDefaultPDiskDisplayState} from '../../utils/disks/displayState';
import {calculateSpaceIcon} from '../../utils/disks/iconCalculators';
import {getPDiskDriveDisplayState, getPDiskStateDisplayState} from '../../utils/disks/pdiskState';
import {calculateSpaceSeverity} from '../../utils/disks/severityCalculators';

import {useSpaceLegendSelection} from './StorageExpertModePanel/components/useSpaceLegendSelection';
import {PDisksGroupBy} from './StorageExpertModePanel/constants';
import type {PDisksGroupByValue} from './StorageExpertModePanel/constants';
import {useIsStorageExpertMode, usePDisksGroupByParam} from './useStorageQueryParams';

const EXPERT_MODE_PDISK_WIDTH = 55;

function getModeModifier(groupBy: PDisksGroupByValue): string | undefined {
    switch (groupBy) {
        case PDisksGroupBy.State:
            return 'mode-state';
        case PDisksGroupBy.Space:
            return 'mode-space';
        case PDisksGroupBy.Drive:
            return 'mode-drive';
        default:
            return undefined;
    }
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

            const modeModifier = getModeModifier(pdisksGroupBy);

            if (pDisk.WhiteboardSize === undefined) {
                return {
                    severity: NOT_AVAILABLE_SEVERITY,
                    icon: undefined,
                    modeModifier,
                    isLegendInactive: false,
                    showNoDataPlaceholder: true,
                    allocatedPercent: undefined,
                    width: modeModifier ? EXPERT_MODE_PDISK_WIDTH : undefined,
                };
            }

            if (pdisksGroupBy === PDisksGroupBy.Space) {
                const capacityAlert = pDisk.PDiskCapacityAlert;

                return {
                    severity: calculateSpaceSeverity({CapacityAlert: capacityAlert}),
                    icon: calculateSpaceIcon({CapacityAlert: capacityAlert}),
                    modeModifier,
                    isLegendInactive:
                        isCapacityAlert(capacityAlert) && inactiveAlerts.has(capacityAlert),
                    showNoDataPlaceholder: false,
                    allocatedPercent: pDisk.AllocatedPercent,
                    width: EXPERT_MODE_PDISK_WIDTH,
                };
            }

            if (pdisksGroupBy === PDisksGroupBy.Drive) {
                const driveDisplayState = getPDiskDriveDisplayState(pDisk.DriveStatus);

                return {
                    ...driveDisplayState,
                    icon:
                        pDisk.DriveStatus === undefined
                            ? CircleQuestionFill
                            : driveDisplayState.icon,
                    modeModifier,
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
                modeModifier,
                isLegendInactive: false,
                showNoDataPlaceholder: false,
                allocatedPercent: undefined,
                width: EXPERT_MODE_PDISK_WIDTH,
            };
        },
        [inactiveAlerts, isExpertMode, pdisksGroupBy],
    );
}
