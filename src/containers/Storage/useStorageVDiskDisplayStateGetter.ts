import React from 'react';

import {ECapacityAlert, EFlag, isCapacityAlert} from '../../types/api/enums';
import {EVDiskState} from '../../types/api/vdisk';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {DiskDisplayStateGetter} from '../../utils/disks/displayState';
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

function getModeModifier(groupBy: VDisksGroupByValue): string | undefined {
    switch (groupBy) {
        case VDisksGroupBy.State:
            return 'mode-state';
        case VDisksGroupBy.Space:
            return 'mode-space';
        case VDisksGroupBy.FrontQueues:
            return 'mode-frontqueues';
        case VDisksGroupBy.Compaction:
            return 'mode-compaction';
        case VDisksGroupBy.All:
            return 'mode-all';
        default:
            return undefined;
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

export function useStorageVDiskDisplayStateGetter(): DiskDisplayStateGetter {
    const isExpertMode = useIsStorageExpertMode();
    const vdisksGroupBy = useVDisksGroupByParam();
    const inactiveLegendItems = useSpaceLegendSelection();

    return React.useCallback(
        (vDisk, isDonor) => {
            if (!isExpertMode) {
                return getDefaultDiskDisplayState(vDisk);
            }

            const modeModifier = getModeModifier(vdisksGroupBy);

            if (!vDisk.VDiskId) {
                return {
                    severity: NOT_AVAILABLE_SEVERITY,
                    icon: undefined,
                    modeModifier,
                    isLegendInactive: false,
                    showNoDataPlaceholder: true,
                };
            }

            const severityCalculator = getSeverityCalculator(vdisksGroupBy);
            const iconCalculator = getIconCalculator(vdisksGroupBy);
            const isCapacityAlertInactive =
                isCapacityAlert(vDisk.CapacityAlert) &&
                inactiveLegendItems.has(vDisk.CapacityAlert);
            const showAllModeIndicators = vdisksGroupBy === VDisksGroupBy.All && !isDonor;
            const capacityAlertIndicator =
                showAllModeIndicators && !isCapacityAlertInactive
                    ? calculateSpaceIcon(vDisk, isDonor)
                    : undefined;
            const frontQueuesIndicator = showAllModeIndicators
                ? calculateFrontQueuesIcon(vDisk, isDonor)
                : undefined;
            const calculatedCompactionIndicator = showAllModeIndicators
                ? calculateCompactionIcon(vDisk, isDonor)
                : undefined;
            const compactionIndicator = Array.isArray(calculatedCompactionIndicator)
                ? calculatedCompactionIndicator
                : undefined;

            return {
                severity: severityCalculator(vDisk),
                icon: iconCalculator(vDisk, isDonor),
                ...(capacityAlertIndicator ? {capacityAlertIndicator} : {}),
                ...(frontQueuesIndicator ? {frontQueuesIndicator} : {}),
                ...(compactionIndicator ? {compactionIndicator} : {}),
                allModeHasIssues: !isAllModeHealthy(vDisk),
                modeModifier,
                isLegendInactive: vdisksGroupBy === VDisksGroupBy.Space && isCapacityAlertInactive,
                showNoDataPlaceholder: false,
            };
        },
        [inactiveLegendItems, isExpertMode, vdisksGroupBy],
    );
}
