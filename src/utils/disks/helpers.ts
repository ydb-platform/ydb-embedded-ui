import type {IconData} from '@gravity-ui/uikit';

import {valueIsDefined} from '..';
import type {VDiskBlobIndexStatParams} from '../../store/reducers/vdisk/vdisk';
import {EFlag} from '../../types/api/enums';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {generateEvaluator} from '../generateEvaluator';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR,
    NOT_AVAILABLE_SEVERITY_COLOR,
    NUMERIC_SEVERITY_LABEL_ICON,
} from './constants';
import type {PreparedVDisk} from './types';

export function isFullVDiskData(
    disk: PreparedVDisk | TVDiskStateInfo | TVSlotId,
): disk is PreparedVDisk | TVDiskStateInfo {
    return 'VDiskId' in disk;
}

const getSpaceFlag = generateEvaluator([EFlag.Green, EFlag.Yellow, EFlag.Red]);

export const getSpaceSeverity = (allocatedPercent?: number) => {
    return valueIsDefined(allocatedPercent) ? getColorSeverity(getSpaceFlag(allocatedPercent)) : 0;
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

export function getPDiskId({
    nodeId,
    pDiskId,
}: {
    nodeId?: string | number | null;
    pDiskId?: string | number | null;
}) {
    if (valueIsDefined(nodeId) && valueIsDefined(pDiskId)) {
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

export function getVDiskStatusIcon(severity?: number): IconData | undefined {
    if (severity === undefined) {
        return undefined;
    }

    // Display icon only for error and donor
    if (
        severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.Red ||
        severity === DISK_COLOR_STATE_TO_NUMERIC_SEVERITY.DarkGrey
    ) {
        return NUMERIC_SEVERITY_LABEL_ICON[severity];
    }

    return undefined;
}
