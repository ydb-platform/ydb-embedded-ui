import type {TPDiskState} from '../../types/api/pdisk';

import {NOT_AVAILABLE_SEVERITY, PDISK_STATE_SEVERITY} from './constants';
import {getSpaceSeverity} from './helpers';

export function calculatePDiskSeverity<
    T extends {
        State?: TPDiskState;
        AllocatedPercent?: number;
    },
>(pDisk: T) {
    const stateSeverity = getStateSeverity(pDisk.State);
    const spaceSeverity = getSpaceSeverity(pDisk.AllocatedPercent);

    if (stateSeverity === NOT_AVAILABLE_SEVERITY || !spaceSeverity) {
        return stateSeverity;
    }

    return Math.max(stateSeverity, spaceSeverity);
}

export function getStateSeverity(pDiskState?: TPDiskState) {
    return isSeverityKey(pDiskState) ? PDISK_STATE_SEVERITY[pDiskState] : NOT_AVAILABLE_SEVERITY;
}

function isSeverityKey(key?: TPDiskState): key is keyof typeof PDISK_STATE_SEVERITY {
    return key !== undefined && key in PDISK_STATE_SEVERITY;
}
