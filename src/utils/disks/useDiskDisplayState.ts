import React from 'react';

import type {IconData} from '@gravity-ui/uikit';

import {useSpaceLegendSelection} from '../../containers/Storage/StorageExpertModePanel/components/useSpaceLegendSelection';
import {VDisksGroupBy} from '../../containers/Storage/StorageExpertModePanel/constants';
import type {VDisksGroupByValue} from '../../containers/Storage/StorageExpertModePanel/constants';
import {
    useIsStorageExpertMode,
    useStorageQueryParams,
} from '../../containers/Storage/useStorageQueryParams';
import type {ECapacityAlert} from '../../types/api/enums';

import {getIconCalculator} from './getIconStrategy';
import {getSeverityCalculator} from './getSeverityStrategy';
import type {PreparedVDisk} from './types';

export interface DiskDisplayState {
    severity: number;
    icon: IconData | string | undefined;
    modeModifier: string | undefined;
    isLegendInactive?: boolean;
}

/**
 * Get CSS mode modifier for visual variants
 */
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
            // TODO: Implement 'mode-all' when All mode is ready
            return undefined;
        default:
            return undefined;
    }
}

/**
 * Hook to calculate disk severity, icon and visual mode based on current expert mode settings
 * Returns severity for coloring, appropriate icon, and CSS mode modifier for visual variants
 * @param vDisk - VDisk data
 * @param isDonor - Whether this is a donor VDisk
 * @param enableExpertMode - Override to enable/disable expert mode regardless of global setting
 * @returns Object with severity, icon, and modeModifier
 */
export function useDiskDisplayState(
    vDisk: PreparedVDisk,
    isDonor?: boolean,
    enableExpertMode?: boolean,
): DiskDisplayState {
    const isExpertMode = useIsStorageExpertMode();
    const {vdisksGroupBy} = useStorageQueryParams();
    const inactiveLegendItems = useSpaceLegendSelection();

    return React.useMemo(() => {
        let severity: number;
        let icon: IconData | string | undefined;
        let modeModifier: string | undefined;
        let isLegendInactive = false;

        const shouldUseExpertMode = (enableExpertMode ?? true) && isExpertMode;

        if (shouldUseExpertMode) {
            // Expert mode: use dynamic calculation based on groupBy
            const severityCalculator = getSeverityCalculator(vdisksGroupBy);
            severity = severityCalculator(vDisk);

            const iconCalculator = getIconCalculator(vdisksGroupBy);
            icon = iconCalculator(vDisk, severity, isDonor);

            modeModifier = getModeModifier(vdisksGroupBy);

            // Check if this disk's capacityAlert is inactive in Space mode legend
            if (vdisksGroupBy === VDisksGroupBy.Space && vDisk.CapacityAlert) {
                // CapacityAlert can be string or ECapacityAlert, check if it's in inactive set
                const alert = vDisk.CapacityAlert as ECapacityAlert;
                isLegendInactive = inactiveLegendItems.has(alert);
            }
        } else {
            // Default mode (Expert Mode OFF): use pre-calculated Severity
            severity = vDisk.Severity ?? 0;

            // Default icon: let DiskStateProgressBar handle it via getVDiskStatusIcon fallback
            icon = undefined;

            modeModifier = undefined; // No modifier = default styles
        }

        return {severity, icon, modeModifier, isLegendInactive};
    }, [enableExpertMode, isExpertMode, vdisksGroupBy, vDisk, isDonor, inactiveLegendItems]);
}
