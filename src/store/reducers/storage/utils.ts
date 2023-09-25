import type {TNodeInfo, TNodesInfo} from '../../../types/api/nodes';
import type {
    TStorageGroupInfo,
    TStorageGroupInfoV2,
    TStorageInfo,
} from '../../../types/api/storage';
import {EVDiskState, type TVDiskStateInfo} from '../../../types/api/vdisk';
import {TPDiskState} from '../../../types/api/pdisk';
import {EFlag} from '../../../types/api/enums';
import {getPDiskType} from '../../../utils/pdisk';
import {getUsage} from '../../../utils/storage';
import {calcUptime} from '../../../utils/dataFormatters/dataFormatters';

import type {PreparedStorageGroup, PreparedStorageNode, PreparedStorageResponse} from './types';

// ==== Constants  ====

const FLAGS_POINTS = {
    [EFlag.Green]: 1,
    [EFlag.Yellow]: 100,
    [EFlag.Orange]: 10_000,
    [EFlag.Red]: 1_000_000,
};

// ==== Prepare groups ====

const prepareVDisk = (vDisk: TVDiskStateInfo, poolName: string | undefined) => {
    // VDisk doesn't have its own StoragePoolName when located inside StoragePool data
    return {
        ...vDisk,
        StoragePoolName: poolName,
        Donors: vDisk.Donors?.map((donor) => ({
            ...donor,
            StoragePoolName: poolName,
        })),
    };
};

const prepareStorageGroupData = (
    group: TStorageGroupInfo,
    poolName?: string,
): PreparedStorageGroup => {
    let missing = 0;
    let usedSpaceFlag = 0;
    let usedSpaceBytes = 0;
    let limitSizeBytes = 0;
    let readSpeedBytesPerSec = 0;
    let writeSpeedBytesPerSec = 0;
    let mediaType = '';

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

            if (
                !Replicated ||
                PDisk?.State !== TPDiskState.Normal ||
                VDiskState !== EVDiskState.OK
            ) {
                missing += 1;
            }

            if (DiskSpace && DiskSpace !== EFlag.Grey) {
                usedSpaceFlag += FLAGS_POINTS[DiskSpace];
            }

            const available = Number(AvailableSize ?? PDisk?.AvailableSize) || 0;
            const allocated = Number(AllocatedSize) || 0;

            usedSpaceBytes += allocated;
            limitSizeBytes += available + allocated;

            readSpeedBytesPerSec += Number(ReadThroughput) || 0;
            writeSpeedBytesPerSec += Number(WriteThroughput) || 0;

            const currentType = getPDiskType(PDisk || {});
            mediaType =
                currentType && (currentType === mediaType || mediaType === '')
                    ? currentType
                    : 'Mixed';
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
        Kind: mediaType || undefined,
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
        Kind,
        VDisks: vDisks,
        Usage: usage,
        Read: Number(Read),
        Write: Number(Write),
        Used: Number(Used),
        Limit: Number(Limit),
        Degraded: Number(Degraded),
    };
};

// ==== Prepare nodes ====

const prepareStorageNodeData = (node: TNodeInfo): PreparedStorageNode => {
    const systemState = node.SystemState ?? {};
    const missing =
        node.PDisks?.filter((pDisk) => {
            return pDisk.State !== TPDiskState.Normal;
        }).length || 0;

    return {
        NodeId: node.NodeId,
        SystemState: systemState.SystemState,
        DataCenter: systemState.DataCenter,
        Rack: systemState.Rack,
        Host: systemState.Host,
        Endpoints: systemState.Endpoints,
        Uptime: calcUptime(systemState.StartTime),
        StartTime: systemState.StartTime,
        PDisks: node.PDisks,
        VDisks: node.VDisks,
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

    let preparedGroups: PreparedStorageGroup[] = [];

    if (StorageGroups) {
        preparedGroups = StorageGroups.map(prepareStorageGroupDataV2);
    } else {
        StoragePools?.forEach((pool) => {
            pool.Groups?.forEach((group) => {
                preparedGroups.push(prepareStorageGroupData(group, pool.Name));
            });
        });
    }

    return {
        groups: preparedGroups,
        total: Number(TotalGroups) || preparedGroups.length,
        found: Number(FoundGroups),
    };
};
