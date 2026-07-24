import React from 'react';

import {isCapacityAlert} from '../../types/api/enums';
import {NOT_AVAILABLE_SEVERITY} from '../../utils/disks/constants';
import type {DiskDisplayStateGetter} from '../../utils/disks/displayState';
import {getDefaultDiskDisplayState} from '../../utils/disks/displayState';
import {getIconCalculator} from '../../utils/disks/getIconStrategy';
import {getSeverityCalculator} from '../../utils/disks/getSeverityStrategy';
import type {VDisksGroupByValue} from '../../utils/disks/groupBy';
import {VDisksGroupBy} from '../../utils/disks/groupBy';
import {isFullVDiskData} from '../../utils/disks/helpers';

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
        default:
            return undefined;
    }
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

            if (!isFullVDiskData(vDisk)) {
                return {
                    severity: NOT_AVAILABLE_SEVERITY,
                    icon: undefined,
                    modeModifier,
                    isLegendInactive: false,
                };
            }

            const severityCalculator = getSeverityCalculator(vdisksGroupBy);
            const iconCalculator = getIconCalculator(vdisksGroupBy);

            const isLegendInactive =
                vdisksGroupBy === VDisksGroupBy.Space &&
                isCapacityAlert(vDisk.CapacityAlert) &&
                inactiveLegendItems.has(vDisk.CapacityAlert);

            return {
                severity: severityCalculator(vDisk),
                icon: iconCalculator(vDisk, isDonor),
                modeModifier,
                isLegendInactive,
            };
        },
        [inactiveLegendItems, isExpertMode, vdisksGroupBy],
    );
}
