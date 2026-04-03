import type {IconData} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import type {VDiskBlobIndexStatParams} from '../../store/reducers/vdisk/vdisk';
import {EFlag} from '../../types/api/enums';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {stringifyVdiskId} from '../dataFormatters/dataFormatters';
import {generateEvaluator} from '../generateEvaluator';

import {
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR,
    DISPLAYED_DISK_ERROR_ICON,
    DONOR_ICON,
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

/**
 * Build a location key for a VDisk using its physical slot coordinates.
 * Returns undefined when any coordinate is missing.
 */
export function makeVDiskLocationKey(
    nodeId?: number,
    pDiskId?: number,
    vDiskSlotId?: number,
): string | undefined {
    if (isNil(nodeId) || isNil(pDiskId) || isNil(vDiskSlotId)) {
        return undefined;
    }

    return stringifyVdiskId({
        NodeId: nodeId,
        PDiskId: pDiskId,
        VSlotId: vDiskSlotId,
    });
}

/**
 * Set Recipient references on donor VDisks pointing back to their acceptor VDisk.
 *
 * For every VDisk that has a non-empty Donors array, each donor is matched to a
 * top-level VDisk by its physical location (NodeId, PDiskId, VDiskSlotId). When a
 * match is found the top-level donor receives a Recipient reference and its
 * StringifiedId is kept in sync with the nested donor entry.
 *
 * Accepts a callback that iterates over all VDisks to avoid creating intermediate
 * flat copies. The callback is invoked twice: once to build the location index and
 * once to resolve donor→recipient links.
 *
 * Mutates the VDisks in place.
 */
export function setDonorRecipientReferences(
    forEachVDisk: (cb: (vDisk: PreparedVDisk) => void) => void,
) {
    const vDiskByLocation = new Map<string, PreparedVDisk>();

    forEachVDisk((vDisk) => {
        const key = makeVDiskLocationKey(vDisk.NodeId, vDisk.PDiskId, vDisk.VDiskSlotId);
        if (key) {
            vDiskByLocation.set(key, vDisk);
        }
    });

    forEachVDisk((vDisk) => {
        if (!vDisk.Donors?.length) {
            return;
        }

        for (const donorRef of vDisk.Donors) {
            const key = makeVDiskLocationKey(
                donorRef.NodeId,
                donorRef.PDiskId,
                donorRef.VDiskSlotId,
            );

            if (!key) {
                continue;
            }

            const donor = vDiskByLocation.get(key);
            if (!donor) {
                continue;
            }

            donor.Recipient = {
                NodeId: vDisk.NodeId,
                StringifiedId: vDisk.StringifiedId,
            };

            // Keep the Donors item in sync with the real donor VDisk:
            // reuse its StringifiedId instead of the local slot-based id
            if (donorRef.StringifiedId !== donor.StringifiedId) {
                donorRef.StringifiedId = donor.StringifiedId;
            }
        }
    });
}
