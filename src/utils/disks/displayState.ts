import type {IconData} from '@gravity-ui/uikit';

import {DATA_SEVERITY, DISK_COLOR_STATE_TO_NUMERIC_SEVERITY} from './constants';
import type {IconWithColor} from './iconCalculators';
import type {DisplaySeverity, PreparedPDisk, PreparedVDisk} from './types';

export type DiskDisplayMode =
    | 'state'
    | 'space'
    | 'frontQueues'
    | 'compaction'
    | 'all'
    | 'drive'
    | 'decommit'
    | 'maintenance'
    | 'device';

export type DiskIndicatorValue = IconData | IconWithColor[] | string;

export interface AllModeIndicatorsState {
    capacityAlert?: IconData | string;
    frontQueues?: IconData;
    compaction?: IconWithColor[];
}

export interface AllModeDisplayState {
    hasIssues?: boolean;
    indicators: AllModeIndicatorsState;
}

export interface PDiskAllModeIndicatorsState {
    capacityAlert?: IconData | string;
    drive?: IconData;
    decommit?: IconData;
    maintenance?: IconData;
    device?: IconWithColor[];
}

export interface PDiskAllModeDisplayState {
    hasIssues?: boolean;
    indicators: PDiskAllModeIndicatorsState;
}

export interface BaseDiskDisplayState {
    severity: DisplaySeverity;
    icon: DiskIndicatorValue | undefined;
    mode: DiskDisplayMode | undefined;
    isLegendInactive?: boolean;
    showNoDataPlaceholder?: boolean;
}

export interface VDiskDisplayState extends BaseDiskDisplayState {
    allocatedPercent?: number;
    showAllocatedPercentLabel?: boolean;
    striped: boolean;
    iconPlacement: 'inline' | 'overlap';
    allMode?: AllModeDisplayState;
}

export interface PDiskDisplayState extends BaseDiskDisplayState {
    width?: number;
    allocatedPercent?: number;
    showAllocatedPercentLabel?: boolean;
    iconPlacement?: 'inline' | 'overlap';
    allMode?: PDiskAllModeDisplayState;
}

export type VDiskDisplayStateGetter = (
    vDisk: PreparedVDisk,
    isDonor?: boolean,
) => VDiskDisplayState;

export type PDiskDisplayStateGetter = (pDisk: PreparedPDisk) => PDiskDisplayState;

export function getDefaultDiskDisplayState(
    vDisk: PreparedVDisk,
    isDonor?: boolean,
): VDiskDisplayState {
    const severity = (vDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity;

    return {
        severity,
        icon: undefined,
        mode: undefined,
        isLegendInactive: false,
        allocatedPercent: vDisk.AllocatedPercent,
        showAllocatedPercentLabel: true,
        striped: severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Blue || Boolean(isDonor),
        iconPlacement: 'inline',
    };
}

export function getDefaultPDiskDisplayState(pDisk: PreparedPDisk): PDiskDisplayState {
    return {
        severity: (pDisk.Severity ?? DATA_SEVERITY.GREY) as DisplaySeverity,
        icon: undefined,
        mode: undefined,
        isLegendInactive: false,
        showNoDataPlaceholder: true,
        allocatedPercent: pDisk.AllocatedPercent,
        showAllocatedPercentLabel: true,
        iconPlacement: 'inline',
    };
}
