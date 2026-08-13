import type {IconData} from '@gravity-ui/uikit';

import {DATA_SEVERITY} from './constants';
import type {IconWithColor} from './iconCalculators';
import type {DisplaySeverity, PreparedPDisk, PreparedVDisk} from './types';

export interface DiskDisplayState {
    severity: DisplaySeverity;
    icon: IconData | IconWithColor[] | string | undefined;
    capacityAlertIndicator?: IconData | string;
    frontQueuesIndicator?: IconData;
    compactionIndicator?: IconWithColor[];
    allModeHasIssues?: boolean;
    modeModifier: string | undefined;
    isLegendInactive?: boolean;
    showNoDataPlaceholder?: boolean;
}

export interface PDiskDisplayState extends DiskDisplayState {
    width?: number;
    allocatedPercent?: number;
}

export type DiskDisplayStateGetter = (vDisk: PreparedVDisk, isDonor?: boolean) => DiskDisplayState;

export type PDiskDisplayStateGetter = (pDisk: PreparedPDisk) => PDiskDisplayState;

export function getDefaultDiskDisplayState(vDisk: PreparedVDisk): DiskDisplayState {
    return {
        severity: (vDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity,
        icon: undefined,
        modeModifier: undefined,
        isLegendInactive: false,
    };
}

export function getDefaultPDiskDisplayState(pDisk: PreparedPDisk): PDiskDisplayState {
    return {
        severity: (pDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity,
        icon: undefined,
        modeModifier: undefined,
        isLegendInactive: false,
        showNoDataPlaceholder: true,
        allocatedPercent: pDisk.AllocatedPercent,
    };
}
