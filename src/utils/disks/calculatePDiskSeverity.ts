import {EFlag} from '../../types/api/enums';
import type {TPDiskState, TPDiskStateInfo} from '../../types/api/pdisk';
import {generateEvaluator} from '../generateEvaluator';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    NOT_AVAILABLE_SEVERITY,
    PDISK_STATE_SEVERITY,
} from './constants';

const getUsageSeverityForPDisk = generateEvaluator(85, 95, [EFlag.Green, EFlag.Yellow, EFlag.Red]);

export function calculatePDiskSeverity(pDisk: TPDiskStateInfo, allocatedPercent = 0) {
    const stateSeverity = getStateSeverity(pDisk.State);
    const spaceSeverityFlag = getUsageSeverityForPDisk(allocatedPercent);

    if (stateSeverity === NOT_AVAILABLE_SEVERITY || !spaceSeverityFlag) {
        return stateSeverity;
    }

    return Math.max(stateSeverity, DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[spaceSeverityFlag]);
}

function getStateSeverity(pDiskState?: TPDiskState) {
    return isSeverityKey(pDiskState) ? PDISK_STATE_SEVERITY[pDiskState] : NOT_AVAILABLE_SEVERITY;
}

function isSeverityKey(key?: TPDiskState): key is keyof typeof PDISK_STATE_SEVERITY {
    return key !== undefined && key in PDISK_STATE_SEVERITY;
}
