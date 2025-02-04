import {valueIsDefined} from '..';
import {EFlag} from '../../types/api/enums';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {generateEvaluator} from '../generateEvaluator';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR,
    NOT_AVAILABLE_SEVERITY_COLOR,
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

export function getPDiskId(nodeId?: string | number | null, pDiskId?: string | number | null) {
    if (valueIsDefined(nodeId) && valueIsDefined(pDiskId)) {
        return `${nodeId}-${pDiskId}`;
    }
    return undefined;
}

export function getVDiskSlotBasedId(
    nodeId: string | number,
    pDiskId: string | number,
    vDiskSlotId: string | number,
) {
    return [nodeId, pDiskId, vDiskSlotId].join('-');
}
