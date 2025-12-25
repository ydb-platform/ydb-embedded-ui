import type {IconData} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import type {VDiskBlobIndexStatParams} from '../../store/reducers/vdisk/vdisk';
import {EFlag} from '../../types/api/enums';
import type {ECapacityAlert, TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {generateEvaluator} from '../generateEvaluator';

import {
    CAPACITY_ALERT_TO_NUMERIC_SEVERITY,
    DEFAULT_CAPACITY_ALERT,
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR,
    DISPLAYED_DISK_ERROR_ICON,
    DONOR_ICON,
    NOT_AVAILABLE_SEVERITY_COLOR,
    NUMERIC_SEVERITY_TO_CAPACITY_ALERT,
} from './constants';
import type {PreparedVDisk} from './types';

export function isFullVDiskData(
    disk: PreparedVDisk | TVDiskStateInfo | TVSlotId,
): disk is PreparedVDisk | TVDiskStateInfo {
    return 'VDiskId' in disk;
}

const getSpaceFlag = generateEvaluator([EFlag.Green, EFlag.Yellow, EFlag.Red]);

export const getSpaceSeverity = (allocatedPercent?: number) => {
    return isNil(allocatedPercent) ? 0 : getColorSeverity(getSpaceFlag(allocatedPercent));
};

export function getSeverityColor(severity: number | undefined) {
    if (severity === undefined) {
        return NOT_AVAILABLE_SEVERITY_COLOR;
    }

    return DISK_NUMERIC_SEVERITY_TO_STATE_COLOR[severity] || NOT_AVAILABLE_SEVERITY_COLOR;
}

export function getColorSeverity(color?: EFlag) {
    return color ? DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[color] : 0;
}

export function getSeverityCapacityAlert(severity: number | undefined) {
    if (severity === undefined) {
        return DEFAULT_CAPACITY_ALERT;
    }

    return NUMERIC_SEVERITY_TO_CAPACITY_ALERT[severity] || DEFAULT_CAPACITY_ALERT;
}

export function getCapacityAlertSeverity(capacityAlert?: ECapacityAlert) {
    return capacityAlert ? CAPACITY_ALERT_TO_NUMERIC_SEVERITY[capacityAlert] : 0;
}

export function getPDiskId({
    nodeId,
    pDiskId,
}: {
    nodeId?: string | number | null;
    pDiskId?: string | number | null;
}) {
    if (!isNil(nodeId) && !isNil(pDiskId)) {
        return `${nodeId}-${pDiskId}`;
    }
    return undefined;
}

export function getVDiskId(params: VDiskBlobIndexStatParams) {
    const parts =
        'vDiskId' in params
            ? [params.vDiskId]
            : [params.nodeId, params.pDiskId, params.vDiskSlotId];
    return parts.join('-');
}

export function getVDiskStatusIcon(severity?: number, isDonor?: boolean): IconData | undefined {
    if (severity === undefined) {
        return undefined;
    }

    const isError = severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red;

    // Display icon only for error and donor
    if (isDonor) {
        return DONOR_ICON;
    }

    if (isError) {
        return DISPLAYED_DISK_ERROR_ICON;
    }

    return undefined;
}
