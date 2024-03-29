import type {TNodeInfo, TNodesInfo} from '../../../types/api/nodes';
import type {
    TStorageGroupInfo,
    TStorageGroupInfoV2,
    TStorageInfo,
    TStoragePoolInfo,
} from '../../../types/api/storage';
import {EVDiskState, type TVDiskStateInfo} from '../../../types/api/vdisk';
import {TPDiskState} from '../../../types/api/pdisk';
import {EFlag} from '../../../types/api/enums';
import {preparePDiskData, prepareVDiskData} from '../../../utils/disks/prepareDisks';
import {getUsage} from '../../../utils/storage';
import {prepareNodeSystemState} from '../../../utils/nodes';

import type {PreparedStorageGroup, PreparedStorageNode, PreparedStorageResponse} from './types';

// ==== Constants  ====

// Do not count Grey and Blue statuses in used space severity calculations
const FLAGS_POINTS: Record<EFlag, number> = {
    [EFlag.Grey]: 0,
    [EFlag.Blue]: 0,

    [EFlag.Green]: 1,
    [EFlag.Yellow]: 100,
    [EFlag.Orange]: 10_000,
    [EFlag.Red]: 1_000_000,
};

// ==== Prepare groups ====

const prepareVDisk = (vDisk: TVDiskStateInfo, poolName: string | undefined) => {
    const preparedVDisk = prepareVDiskData(vDisk);

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
    let usedSpaceFlag = 0;
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
                DiskSpace,
                ReadThroughput,
                WriteThroughput,
            } = vDisk;

            const {
                Type: PDiskType,
                State: PDiskState,
                AvailableSize: PDiskAvailableSize,
            } = preparePDiskData(PDisk);

            if (!Replicated || PDiskState !== TPDiskState.Normal || VDiskState !== EVDiskState.OK) {
                missing += 1;
            }

            if (DiskSpace) {
                usedSpaceFlag += FLAGS_POINTS[DiskSpace];
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
    const usage = getUsage({Used: usedSpaceBytes, Limit: limitSizeBytes}, 5);

    return {
        ...group,
        VDisks: vDisks,
        Usage: usage,
        Read: readSpeedBytesPerSec,
        Write: writeSpeedBytesPerSec,
        PoolName: poolName,
        Used: usedSpaceBytes,
        Limit: limitSizeBytes,
        Degraded: missing,
        UsedSpaceFlag: usedSpaceFlag,
        MediaType: poolMediaType || mediaType || undefined,
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
    } = group;

    const UsedSpaceFlag = VDisks.reduce((acc, {DiskSpace}) => {
        if (DiskSpace && DiskSpace !== EFlag.Grey) {
            return acc + FLAGS_POINTS[DiskSpace];
        }
        return acc;
    }, 0);

    const vDisks = VDisks.map((vdisk) => prepareVDisk(vdisk, PoolName));
    const usage = Math.floor(Number(Usage) * 100);

    return {
        ...group,
        UsedSpaceFlag,
        PoolName,
        MediaType: MediaType || Kind,
        VDisks: vDisks,
        Usage: usage,
        Read: Number(Read),
        Write: Number(Write),
        Used: Number(Used),
        Limit: Number(Limit),
        Degraded: Number(Degraded),
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
            ...preparePDiskData(pDisk),
            NodeId: node.NodeId,
        };
    });
    const vDisks = node.VDisks?.map((vDisk) => {
        return {
            ...prepareVDiskData(vDisk),
            NodeId: node.NodeId,
        };
    });

    return {
        ...prepareNodeSystemState(node.SystemState),
        NodeId: node.NodeId,
        PDisks: pDisks,
        VDisks: vDisks,
        Missing: missing,
    };
};

// ==== Prepare responses ====

export const prepareStorageNodesResponse = (data: TNodesInfo): PreparedStorageResponse => {
    const {Nodes, TotalNodes, FoundNodes} = data;

    const preparedNodes = Nodes?.map(prepareStorageNodeData);

    return {
        nodes: preparedNodes,
        total: Number(TotalNodes) || preparedNodes?.length,
        found: Number(FoundNodes),
    };
};

export const prepareStorageGroupsResponse = (data: TStorageInfo): PreparedStorageResponse => {
    const {StoragePools, StorageGroups, TotalGroups, FoundGroups} = data;

    const preparedGroups = prepareStorageGroups(StorageGroups, StoragePools);

    return {
        groups: preparedGroups,
        total: Number(TotalGroups) || preparedGroups.length,
        found: Number(FoundGroups),
    };
};
