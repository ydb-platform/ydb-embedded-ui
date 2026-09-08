import type {EFlag} from '../../../types/api/enums';
import type {TNodeInfo, TNodesInfo} from '../../../types/api/nodes';
import {TPDiskState} from '../../../types/api/pdisk';
import type {StorageGroupsResponse, TGroupsStorageGroupInfo} from '../../../types/api/storage';
import {
    getColorSeverity,
    getDataSeverityColor,
    setDonorRecipientReferences,
} from '../../../utils/disks/helpers';
import {
    prepareWhiteboardPDiskData,
    prepareWhiteboardVDiskData,
} from '../../../utils/disks/prepareDisks';
import {prepareNodeSystemState} from '../../../utils/nodes';
import {parseUsToMs} from '../../../utils/timeParsers';
import {parseOptionalNonNegativeNumber} from '../../../utils/utils';

import {prepareGroupsVDisk} from './prepareGroupsDisks';
import type {
    PreparedStorageGroup,
    PreparedStorageNode,
    PreparedStorageResponse,
    TableGroup,
} from './types';

// Normalizes "Max*" capacity metrics that come from API as a percentage in the 0..100 range.
// Important: `0` is a valid value and must be preserved (do not treat it as falsy).
const normalizeMaxPercent = (value: number | string | null | undefined): number | undefined => {
    if (value === null) {
        return undefined;
    }

    const num = parseOptionalNonNegativeNumber(value);

    return num === undefined ? undefined : num / 100;
};

// ==== Prepare groups ====

function getGroupDiskSpaceStatus(group: TGroupsStorageGroupInfo): EFlag {
    const {DiskSpace, VDisks = []} = group;

    if (DiskSpace) {
        return DiskSpace;
    }

    // Calculate max severity from VDisks and convert back to EFlag
    const maxSeverity = Math.max(...VDisks.map((disk) => getColorSeverity(disk.DiskSpace)));
    // getDataSeverityColor returns EFlag for basic severities (0-5).
    // We cast it since we know VDisk.DiskSpace is always EFlag
    return getDataSeverityColor(maxSeverity);
}

// ==== Prepare nodes ====

const prepareStorageNodeData = (
    node: TNodeInfo,
    maximumSlotsPerDisk: number,
    maximumDisksPerNode: number,
): PreparedStorageNode => {
    const {
        SystemState,
        NodeId,
        PDisks,
        VDisks,
        MaxPDiskUsage,
        MaxVDiskSlotUsage,
        MaxVDiskRawUsage,
        CapacityAlert,
        ...restNodeParams
    } = node;

    const missing =
        PDisks?.filter((pDisk) => {
            return pDisk.State !== TPDiskState.Normal;
        }).length || 0;

    const pDisks = PDisks?.map((pDisk) => {
        return {
            ...prepareWhiteboardPDiskData(pDisk),
            NodeId,
        };
    });
    const vDisks = VDisks?.map((vDisk) => {
        return {
            ...prepareWhiteboardVDiskData(vDisk),
            NodeId,
        };
    });

    return {
        ...restNodeParams,
        ...prepareNodeSystemState(SystemState),
        // There is NodeId both in node and its system state
        // We should use only NodeId from node, since it's always present (there may be no SystemState)
        NodeId,
        PDisks: pDisks,
        VDisks: vDisks,
        Missing: missing,
        MaximumSlotsPerDisk: maximumSlotsPerDisk,
        MaximumDisksPerNode: maximumDisksPerNode,
        MaxPDiskUsage: normalizeMaxPercent(MaxPDiskUsage),
        MaxVDiskSlotUsage: normalizeMaxPercent(MaxVDiskSlotUsage),
        MaxVDiskRawUsage: normalizeMaxPercent(MaxVDiskRawUsage),
        CapacityAlert,
    };
};

/**
 * Calculates the maximum number of VDisk slots per PDisk across all nodes
 * A slot represents a VDisk that can be allocated to a PDisk
 */
export const calculateMaximumSlotsPerDisk = (
    nodes: TNodeInfo[] | undefined,
    providedMaximumSlotsPerDisk?: string,
): number => {
    if (providedMaximumSlotsPerDisk && !isNaN(Number(providedMaximumSlotsPerDisk))) {
        return Number(providedMaximumSlotsPerDisk);
    }

    const safeNodes = nodes || [];
    const slotsPerDiskCounts = safeNodes.flatMap((node) => {
        const safePDisks = node.PDisks || [];
        const safeVDisks = node.VDisks || [];

        return safePDisks.map((pDisk) => {
            const vDisksOnPDisk = safeVDisks.filter((vDisk) => vDisk.PDiskId === pDisk.PDiskId);
            return vDisksOnPDisk.length || 0;
        });
    });

    const maxSlots = Math.max(1, ...slotsPerDiskCounts);
    return maxSlots;
};

/**
 * Calculates the maximum number of PDisks per node across all nodes
 */
export const calculateMaximumDisksPerNode = (
    nodes: TNodeInfo[] | undefined,
    providedMaximumDisksPerNode?: string,
): number => {
    if (providedMaximumDisksPerNode && !isNaN(Number(providedMaximumDisksPerNode))) {
        return Number(providedMaximumDisksPerNode);
    }

    const safeNodes = nodes || [];
    const disksPerNodeCounts = safeNodes.map((node) => node.PDisks?.length || 0);
    const maxDisks = Math.max(1, ...disksPerNodeCounts);
    return maxDisks;
};

// Attaches recipient references to donor VDisks based on their Donors relations
const attachRecipientsToDonors = (nodes: PreparedStorageNode[] | undefined) => {
    if (!nodes?.length) {
        return;
    }

    setDonorRecipientReferences((cb) => {
        for (const node of nodes) {
            if (node.VDisks) {
                for (const vDisk of node.VDisks) {
                    cb(vDisk);
                }
            }
        }
    });
};

// ==== Prepare responses ====

export const prepareStorageNodesResponse = (data: TNodesInfo): PreparedStorageResponse => {
    const {Nodes, TotalNodes, FoundNodes, NodeGroups, MaximumSlotsPerDisk, MaximumDisksPerNode} =
        data;

    const tableGroups = NodeGroups?.map(({GroupName, NodeCount}) => {
        if (GroupName && NodeCount) {
            return {
                name: GroupName,
                count: Number(NodeCount),
            };
        }
        return undefined;
    }).filter((group): group is TableGroup => Boolean(group));

    const maxSlotsPerDisk = calculateMaximumSlotsPerDisk(Nodes, MaximumSlotsPerDisk);
    const maxDisksPerNode = calculateMaximumDisksPerNode(Nodes, MaximumDisksPerNode);
    const preparedNodes = Nodes?.map((node) =>
        prepareStorageNodeData(node, maxSlotsPerDisk, maxDisksPerNode),
    );

    attachRecipientsToDonors(preparedNodes);

    return {
        nodes: preparedNodes,
        total: Number(TotalNodes) || preparedNodes?.length,
        found: Number(FoundNodes),
        tableGroups,
        columnsSettings: {maxSlotsPerDisk, maxDisksPerNode},
    };
};

export function prepareGroupsResponse(data: StorageGroupsResponse): PreparedStorageResponse {
    const {FoundGroups, TotalGroups, StorageGroups = [], StorageGroupGroups} = data;
    const preparedGroups: PreparedStorageGroup[] = StorageGroups.map((group) => {
        const {
            Usage,
            DiskSpaceUsage,
            Read,
            Write,
            Used,
            Limit,
            MissingDisks,
            VDisks = [],
            Overall,
            LatencyPutTabletLog,
            LatencyPutUserData,
            LatencyGetFast,
            MaxPDiskUsage,
            MaxVDiskSlotUsage,
            MaxVDiskRawUsage,
            MaxNormalizedOccupancy,
            CapacityAlert,
        } = group;

        const vDisks = VDisks.map(prepareGroupsVDisk);

        const diskSpaceStatus = getGroupDiskSpaceStatus(group);

        return {
            ...group,
            Usage,
            DiskSpaceUsage,
            Read: Number(Read),
            Write: Number(Write),
            Used: Number(Used),
            Limit: Number(Limit),

            LatencyPutTabletLogMs: parseUsToMs(LatencyPutTabletLog),
            LatencyPutUserDataMs: parseUsToMs(LatencyPutUserData),
            LatencyGetFastMs: parseUsToMs(LatencyGetFast),

            Degraded: Number(MissingDisks),
            Overall,

            VDisks: vDisks,

            DiskSpace: diskSpaceStatus,

            MaxPDiskUsage: normalizeMaxPercent(MaxPDiskUsage),
            MaxVDiskRawUsage: normalizeMaxPercent(MaxVDiskRawUsage),
            MaxVDiskSlotUsage: normalizeMaxPercent(MaxVDiskSlotUsage),
            MaxNormalizedOccupancy,
            CapacityAlert,
        };
    });

    const tableGroups = StorageGroupGroups?.map(({GroupName, GroupCount}) => {
        if (GroupName && GroupCount) {
            return {
                name: GroupName,
                count: Number(GroupCount),
            };
        }
        return undefined;
    }).filter((group): group is TableGroup => Boolean(group));

    return {
        groups: preparedGroups,
        total: Number(TotalGroups) || preparedGroups.length,
        found: Number(FoundGroups),
        tableGroups,
    };
}
