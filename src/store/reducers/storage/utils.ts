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
import {getColorSeverity, getSeverityColor} from '../../../utils/disks/helpers';
import {
    prepareWhiteboardPDiskData,
    prepareWhiteboardVDiskData,
} from '../../../utils/disks/prepareDisks';
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

export const prepareStorageGroupData = (
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

            if (!Replicated || PDiskState !== TPDiskState.Normal || VDiskState !== EVDiskState.OK) {
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

export const prepareStorageGroupDataV2 = (group: TStorageGroupInfoV2): PreparedStorageGroup => {
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

export const prepareStorageGroups = (
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

// ==== Prepare nodes ====

const prepareStorageNodeData = (node: TNodeInfo): PreparedStorageNode => {
    const missing =
        node.PDisks?.filter((pDisk) => {
            return pDisk.State !== TPDiskState.Normal;
        }).length || 0;

    const pDisks = node.PDisks?.map((pDisk) => {
        return {
            ...prepareWhiteboardPDiskData(pDisk),
            NodeId: node.NodeId,
        };
    });
    const vDisks = node.VDisks?.map((vDisk) => {
        return {
            ...prepareWhiteboardVDiskData(vDisk),
            NodeId: node.NodeId,
        };
    });

    return {
        ...prepareNodeSystemState(node.SystemState),
        NodeId: node.NodeId,
        DiskSpaceUsage: node.DiskSpaceUsage,
        PDisks: pDisks,
        VDisks: vDisks,
        Missing: missing,
    };
};

// ==== Prepare responses ====

export const prepareStorageNodesResponse = (data: TNodesInfo): PreparedStorageResponse => {
    const {Nodes, TotalNodes, FoundNodes, NodeGroups} = data;

    const tableGroups = NodeGroups?.map(({GroupName, NodeCount}) => {
        if (GroupName && NodeCount) {
            return {
                name: GroupName,
                count: Number(NodeCount),
            };
        }
        return undefined;
    }).filter((group): group is TableGroup => Boolean(group));

    const preparedNodes = Nodes?.map(prepareStorageNodeData);

    return {
        nodes: preparedNodes,
        total: Number(TotalNodes) || preparedNodes?.length,
        found: Number(FoundNodes),
        tableGroups,
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
