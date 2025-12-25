import {isNil} from 'lodash';

import type {EFlag} from '../../../types/api/enums';
import type {TNodeInfo, TNodesInfo} from '../../../types/api/nodes';
import {TPDiskState} from '../../../types/api/pdisk';
import type {
    StorageGroupsResponse,
    TGroupsStorageGroupInfo,
    TStorageGroupInfo,
    TStorageGroupInfoV2,
    TStorageInfo,
    TStoragePoolInfo,
} from '../../../types/api/storage';
import {EVDiskState} from '../../../types/api/vdisk';
import type {TVDiskStateInfo} from '../../../types/api/vdisk';
import {stringifyVdiskId} from '../../../utils/dataFormatters/dataFormatters';
import {
    getCapacityAlertSeverity,
    getColorSeverity,
    getSeverityCapacityAlert,
    getSeverityColor,
} from '../../../utils/disks/helpers';
import {
    prepareWhiteboardPDiskData,
    prepareWhiteboardVDiskData,
} from '../../../utils/disks/prepareDisks';
import type {PreparedVDisk} from '../../../utils/disks/types';
import {prepareNodeSystemState} from '../../../utils/nodes';
import {getUsage} from '../../../utils/storage';
import {parseUsToMs} from '../../../utils/timeParsers';

import {prepareGroupsVDisk} from './prepareGroupsDisks';
import type {
    PreparedStorageGroup,
    PreparedStorageNode,
    PreparedStorageResponse,
    TableGroup,
} from './types';

// ==== Prepare groups ====

function getGroupDiskSpaceStatus(group: TStorageGroupInfo | TGroupsStorageGroupInfo): EFlag {
    const {DiskSpace, VDisks = []} = group;

    return (
        DiskSpace ||
        getSeverityColor(Math.max(...VDisks.map((disk) => getColorSeverity(disk.DiskSpace))))
    );
}

const prepareVDisk = (vDisk: TVDiskStateInfo, poolName: string | undefined) => {
    const preparedVDisk = prepareWhiteboardVDiskData(vDisk);

    // VDisk doesn't have its own StoragePoolName when located inside StoragePool data
    return {
        ...preparedVDisk,
        StoragePoolName: poolName,
        Donors: preparedVDisk?.Donors?.map((donor) => ({
            ...donor,
            StoragePoolName: poolName,
        })),
    };
};

const prepareStorageGroupData = (
    group: TStorageGroupInfo,
    pool: TStoragePoolInfo,
): PreparedStorageGroup => {
    let missing = 0;
    let usedSpaceBytes = 0;
    let limitSizeBytes = 0;
    let readSpeedBytesPerSec = 0;
    let writeSpeedBytesPerSec = 0;
    let mediaType: string | undefined;

    const {Name: poolName, MediaType: poolMediaType} = pool;

    if (group.VDisks) {
        for (const vDisk of group.VDisks) {
            const {
                Replicated,
                VDiskState,
                AvailableSize,
                AllocatedSize,
                PDisk,
                ReadThroughput,
                WriteThroughput,
            } = vDisk;

            const {
                Type: PDiskType,
                State: PDiskState,
                AvailableSize: PDiskAvailableSize,
            } = prepareWhiteboardPDiskData(PDisk);

            if (
                Replicated === false ||
                PDiskState !== TPDiskState.Normal ||
                VDiskState !== EVDiskState.OK
            ) {
                missing += 1;
            }

            const available = Number(AvailableSize ?? PDiskAvailableSize) || 0;
            const allocated = Number(AllocatedSize) || 0;

            usedSpaceBytes += allocated;
            limitSizeBytes += available + allocated;

            readSpeedBytesPerSec += Number(ReadThroughput) || 0;
            writeSpeedBytesPerSec += Number(WriteThroughput) || 0;

            mediaType = PDiskType && (PDiskType === mediaType || !mediaType) ? PDiskType : 'Mixed';
        }
    }

    const vDisks = group.VDisks?.map((vdisk) => prepareVDisk(vdisk, poolName));

    // Do not calculate usage if there is no limit
    const usage = limitSizeBytes
        ? getUsage({Used: usedSpaceBytes, Limit: limitSizeBytes}, 5)
        : undefined;

    const diskSpaceStatus = getGroupDiskSpaceStatus(group);

    return {
        ...group,
        GroupGeneration: group.GroupGeneration ? String(group.GroupGeneration) : undefined,
        GroupId: group.GroupID,
        Overall: group.Overall,
        VDisks: vDisks,
        Usage: usage,
        Read: readSpeedBytesPerSec,
        Write: writeSpeedBytesPerSec,
        PoolName: poolName,
        Used: usedSpaceBytes,
        Limit: limitSizeBytes,
        Degraded: missing,
        MediaType: poolMediaType || mediaType || undefined,
        DiskSpace: diskSpaceStatus,
    };
};

const prepareStorageGroupDataV2 = (group: TStorageGroupInfoV2): PreparedStorageGroup => {
    const {
        VDisks = [],
        PoolName,
        Usage = 0,
        Read = 0,
        Write = 0,
        Used = 0,
        Limit = 0,
        Degraded = 0,
        Kind,
        MediaType,
        GroupID,
        Overall,
        GroupGeneration,
    } = group;

    const vDisks = VDisks.map((vdisk) => prepareVDisk(vdisk, PoolName));
    const usage = Number(Usage) * 100;

    const diskSpaceStatus = getGroupDiskSpaceStatus(group);

    return {
        ...group,
        PoolName,
        GroupId: GroupID,
        MediaType: MediaType || Kind,
        VDisks: vDisks,
        Usage: usage,
        Overall,
        GroupGeneration: GroupGeneration ? String(GroupGeneration) : undefined,
        Read: Number(Read),
        Write: Number(Write),
        Used: Number(Used),
        Limit: Number(Limit),
        Degraded: Number(Degraded),
        DiskSpace: diskSpaceStatus,
    };
};

const prepareStorageGroups = (
    StorageGroups?: TStorageGroupInfoV2[],
    StoragePools?: TStoragePoolInfo[],
) => {
    let preparedGroups: PreparedStorageGroup[] = [];
    if (StorageGroups) {
        preparedGroups = StorageGroups.map(prepareStorageGroupDataV2);
    } else {
        StoragePools?.forEach((pool) => {
            pool.Groups?.forEach((group) => {
                preparedGroups.push(prepareStorageGroupData(group, pool));
            });
        });
    }

    return preparedGroups;
};

// Returns max value ignoring undefined. Returns undefined for empty input
const maxDefined = (values: Array<number | undefined>): number | undefined => {
    const defined = values.filter((value): value is number => value !== undefined);

    return defined.length ? Math.max(...defined) : undefined;
};

// For metrics that are already in percent and must be converted to ratio (percent / 100)
const maxPercentToRatio = (values: Array<number | undefined>): number | undefined => {
    const max = maxDefined(values);
    return max === undefined ? undefined : max / 100;
};

// ==== Prepare nodes ====

const prepareStorageNodeData = (
    node: TNodeInfo,
    maximumSlotsPerDisk: number,
    maximumDisksPerNode: number,
): PreparedStorageNode => {
    const {SystemState, NodeId, PDisks, VDisks, ...restNodeParams} = node;

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

    const MaxPDiskUsage = isNil(pDisks)
        ? undefined
        : maxPercentToRatio(pDisks?.map((pDisk) => pDisk.PDiskUsage));
    const MaxVDiskSlotUsage = isNil(vDisks)
        ? undefined
        : maxPercentToRatio(vDisks?.map((vDisk) => vDisk.VDiskSlotUsage));

    const maxCapacityAlertSeverity = isNil(vDisks)
        ? undefined
        : maxDefined(vDisks?.map((vDisk) => getCapacityAlertSeverity(vDisk.CapacityAlert)));
    const CapacityAlert = getSeverityCapacityAlert(maxCapacityAlertSeverity);

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
        MaxPDiskUsage,
        MaxVDiskSlotUsage,
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

// We need custom key (can't use StringifiedId) because for array of donors in replication's object
// we can have only nodeId, pDiskId, vDiskSlotId -> 3 parameters instead of 5
const makeVDiskLocationKey = (
    nodeId?: number,
    pDiskId?: number,
    vDiskSlotId?: number,
): string | undefined => {
    if (isNil(nodeId) || isNil(pDiskId) || isNil(vDiskSlotId)) {
        return undefined;
    }

    return stringifyVdiskId({
        NodeId: nodeId,
        PDiskId: pDiskId,
        VSlotId: vDiskSlotId,
    });
};

// Attaches recipient references to donor VDisks based on their Donors relations
const attachRecipientsToDonors = (nodes: PreparedStorageNode[] | undefined) => {
    if (!nodes?.length) {
        return;
    }

    const vdiskByLocation = new Map<string, PreparedVDisk>();

    nodes.forEach((node) => {
        node.VDisks?.forEach((vdisk) => {
            const key = makeVDiskLocationKey(vdisk.NodeId, vdisk.PDiskId, vdisk.VDiskSlotId);

            if (key) {
                vdiskByLocation.set(key, vdisk);
            }
        });
    });

    nodes.forEach((node) => {
        node.VDisks?.forEach((replication) => {
            if (replication.Replicated || !replication.Donors?.length) {
                return;
            }

            replication.Donors.forEach((donorRef) => {
                const key = makeVDiskLocationKey(
                    donorRef.NodeId,
                    donorRef.PDiskId,
                    donorRef.VDiskSlotId,
                );

                if (!key) {
                    return;
                }

                const donor = vdiskByLocation.get(key);
                if (!donor) {
                    return;
                }

                donor.Recipient = {
                    NodeId: replication.NodeId,
                    StringifiedId: replication.StringifiedId,
                };

                // Keep the Donors item in sync with the real donor VDisk: reuse its StringifiedId
                // instead of the local slot-based id
                if (donorRef.StringifiedId !== donor.StringifiedId) {
                    donorRef.StringifiedId = donor.StringifiedId;
                }
            });
        });
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

export const prepareStorageResponse = (data: TStorageInfo): PreparedStorageResponse => {
    const {StoragePools, StorageGroups, TotalGroups, FoundGroups} = data;

    const preparedGroups = prepareStorageGroups(StorageGroups, StoragePools);

    return {
        groups: preparedGroups,
        total: Number(TotalGroups) || preparedGroups.length,
        found: Number(FoundGroups),
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
        } = group;

        const vDisks = VDisks.map(prepareGroupsVDisk);

        const diskSpaceStatus = getGroupDiskSpaceStatus(group);

        const MaxPDiskUsage = maxPercentToRatio(vDisks.map((vDisk) => vDisk.PDisk?.PDiskUsage));
        const MaxVDiskSlotUsage = maxPercentToRatio(vDisks.map((vDisk) => vDisk.VDiskSlotUsage));
        const MaxVDiskRawUsage = maxPercentToRatio(vDisks.map((vDisk) => vDisk.VDiskRawUsage));
        const MaxNormalizedOccupancy = maxPercentToRatio(
            vDisks.map((vDisk) => vDisk.NormalizedOccupancy),
        );
        const maxCapacityAlertSeverity = maxDefined(
            vDisks.map((vDisk) => getCapacityAlertSeverity(vDisk.CapacityAlert)),
        );

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

            MaxPDiskUsage,
            MaxVDiskRawUsage,
            MaxVDiskSlotUsage,
            MaxNormalizedOccupancy,
            CapacityAlert: getSeverityCapacityAlert(maxCapacityAlertSeverity),
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
