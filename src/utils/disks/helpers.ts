import type {IconData} from '@gravity-ui/uikit';
import {isNil} from 'lodash';

import type {VDiskBlobIndexStatParams} from '../../store/reducers/vdisk/vdisk';
import {EFlag} from '../../types/api/enums';
import type {TVDiskStateInfo, TVSlotId} from '../../types/api/vdisk';
import {stringifyVdiskId} from '../dataFormatters/dataFormatters';
import {generateEvaluator} from '../generateEvaluator';

import {
    DATA_SEVERITY,
    DISK_COLOR_STATE_TO_NUMERIC_SEVERITY,
    DISK_NUMERIC_SEVERITY_TO_STATE_COLOR,
    DISPLAYED_DISK_ERROR_ICON,
    DONOR_ICON,
    FRONT_QUEUES_SEVERITY,
    NOT_AVAILABLE_SEVERITY_COLOR,
    SOLID_RED_SEVERITY,
    SPACE_SEVERITY,
} from './constants';
import type {DiskColor, PreparedVDisk} from './types';

export function isFullVDiskData(
    disk: PreparedVDisk | TVDiskStateInfo | TVSlotId,
): disk is PreparedVDisk | TVDiskStateInfo {
    return 'VDiskId' in disk;
}

const getSpaceFlag = generateEvaluator([EFlag.Green, EFlag.Yellow, EFlag.Red]);

export const getSpaceSeverity = (allocatedPercent?: number) => {
    return isNil(allocatedPercent)
        ? DATA_SEVERITY.GREY
        : getColorSeverity(getSpaceFlag(allocatedPercent));
};

/**
 * Convert data severity (0-5) to EFlag color.
 * Used for PreparedVDisk.Severity and PreparedPDisk.Severity in Default mode.
 * Returns only basic EFlag colors (Grey, Green, Blue, Yellow, Orange, Red).
 * @param severity - Basic severity level (0-5), or any number (will be clamped to 0-5 range)
 * @returns EFlag color for visualization
 */
export function getDataSeverityColor(severity: number | undefined): EFlag {
    if (severity === undefined || severity < 0 || severity > DATA_SEVERITY.RED) {
        return EFlag.Grey;
    }
    return (DISK_NUMERIC_SEVERITY_TO_STATE_COLOR[severity] || EFlag.Grey) as EFlag;
}

/**
 * Convert display severity (0-19) to disk color.
 * Used for dynamic coloring in Expert Mode based on grouping strategy.
 * Handles extended severity ranges for State, Space, and FrontQueues modes.
 * @param severity - Extended severity level (0-19), or any number
 * @returns Disk color for visualization
 */
export function getDisplaySeverityColor(severity: number | undefined): DiskColor {
    if (severity === undefined) {
        return NOT_AVAILABLE_SEVERITY_COLOR;
    }

    // Special case: SOLID_RED_SEVERITY maps to 'solidred' CSS class
    if (severity === SOLID_RED_SEVERITY) {
        return 'SolidRed';
    }

    // Space mode severities (7-15) map to specific space color classes
    if (severity === SPACE_SEVERITY.GREEN) {
        return EFlag.Green;
    }
    if (severity === SPACE_SEVERITY.CYAN) {
        return 'SpaceCyan';
    }
    if (severity === SPACE_SEVERITY.LIGHT_YELLOW) {
        return 'SpaceLightYellow';
    }
    if (severity === SPACE_SEVERITY.YELLOW) {
        return EFlag.Yellow;
    }
    if (severity === SPACE_SEVERITY.LIGHT_ORANGE) {
        return 'SpaceLightOrange';
    }
    if (severity === SPACE_SEVERITY.PRE_ORANGE) {
        return 'SpacePreOrange';
    }
    if (severity === SPACE_SEVERITY.ORANGE) {
        return 'SpaceOrange';
    }
    if (severity === SPACE_SEVERITY.RED) {
        return EFlag.Red;
    }
    if (severity === SPACE_SEVERITY.BLACK) {
        return 'SpaceBlack';
    }

    // FrontQueues mode severities (16-19) map to colors
    // Grey -> N/A, Green -> OK, Yellow -> Notice, Red -> Warning, SolidRed -> Impaired
    if (severity === FRONT_QUEUES_SEVERITY.OK) {
        return EFlag.Green;
    }
    if (severity === FRONT_QUEUES_SEVERITY.NOTICE) {
        return EFlag.Yellow;
    }
    if (severity === FRONT_QUEUES_SEVERITY.WARNING) {
        return EFlag.Red;
    }
    if (severity === FRONT_QUEUES_SEVERITY.IMPAIRED) {
        return 'SolidRed';
    }

    // Fallback to basic colors for 0-5
    return DISK_NUMERIC_SEVERITY_TO_STATE_COLOR[severity] || NOT_AVAILABLE_SEVERITY_COLOR;
}

export function getColorSeverity(color?: EFlag) {
    return color ? DISK_COLOR_STATE_TO_NUMERIC_SEVERITY[color] : DATA_SEVERITY.GREY;
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
 * For every VDisk that has a non-empty Donors array and is NOT Replicated, each donor is matched to a
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
        if (!vDisk.Donors?.length || vDisk.Replicated) {
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
