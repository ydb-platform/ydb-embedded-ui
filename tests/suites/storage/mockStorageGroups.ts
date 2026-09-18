import {ECapacityAlert, EFlag} from '../../../src/types/api/enums';
import type {TNodeInfo, TNodesInfo} from '../../../src/types/api/nodes';
import type {EDecommitStatus, EDriveStatus, EMaintenanceStatus} from '../../../src/types/api/pdisk';
import {TPDiskState} from '../../../src/types/api/pdisk';
import type {StorageGroupsResponse, TStorageVDisk} from '../../../src/types/api/storage';
import {EVDiskState} from '../../../src/types/api/vdisk';

const MOCK_GROUP_ID = 9000000000;
const MOCK_GROUP_GENERATION = 1;
const MOCK_SLOT_SIZE = 10 * 1024 ** 3;
const MOCK_ALLOCATED_SIZE_BASE = 1024 ** 3;
const MOCK_NODE_ID_BASE = 7000;
const MOCK_PDISK_ID_BASE = 100;
const MOCK_VDISK_SLOT_ID_BASE = 200;

export const MISSING_WHITEBOARD_VDISK_INDEX = 0;
export const MISSING_FRONT_QUEUES_VDISK_INDEX = 1;
export const MISSING_STATE_VDISK_INDEX = 2;
export const MISSING_FRESH_IMPAIRED_LEVEL_VDISK_INDEX = 5;
export const MISSING_PDISK_STATE_INDEX = 6;
export const ALL_GREEN_VDISK_INDEX = 10;

function createMockPDisk(
    index: number,
    state = TPDiskState.Normal,
    capacityAlert?: ECapacityAlert,
    allocatedPercent = 25,
    hasWhiteboard = true,
    driveStatus?: EDriveStatus,
    decommitStatus?: EDecommitStatus,
    maintenanceStatus?: EMaintenanceStatus,
    device?: EFlag,
    realtime?: EFlag,
): TStorageVDisk['PDisk'] {
    const totalSize = MOCK_SLOT_SIZE * 16;
    const availableSize = Math.round(totalSize * (1 - allocatedPercent / 100));

    return {
        PDiskId: `${MOCK_NODE_ID_BASE + index}-${MOCK_PDISK_ID_BASE + index}`,
        Path: `/mock/vdisks-state/pdisk-${index}`,
        Type: index % 3 === 0 ? 'nvme' : index % 3 === 1 ? 'ssd' : 'hdd',
        Guid: String(9000000000000000000 + index),
        TotalSize: String(totalSize),
        AvailableSize: String(availableSize),
        Status: driveStatus,
        DecommitStatus: decommitStatus,
        MaintenanceStatus: maintenanceStatus,
        DiskSpace: EFlag.Green,
        SlotSize: String(MOCK_SLOT_SIZE),
        SlotCount: '16',
        ...(hasWhiteboard
            ? {
                  Whiteboard: {
                      PDiskId: MOCK_PDISK_ID_BASE + index,
                      NodeId: MOCK_NODE_ID_BASE + index,
                      Path: `/mock/vdisks-state/pdisk-${index}`,
                      Guid: String(9000000000000000000 + index),
                      Category: String(index % 3),
                      AvailableSize: String(availableSize),
                      TotalSize: String(totalSize),
                      State: state,
                      ...(device === undefined ? {} : {Device: device}),
                      ...(realtime === undefined ? {} : {Realtime: realtime}),
                      StateFlag: state === TPDiskState.Normal ? EFlag.Green : EFlag.Red,
                      Overall: state === TPDiskState.Normal ? EFlag.Green : EFlag.Red,
                      EnforcedDynamicSlotSize: String(MOCK_SLOT_SIZE),
                      ExpectedSlotCount: 16,
                      NumActiveSlots: 1,
                      PDiskCapacityAlert: capacityAlert,
                  },
              }
            : {}),
    };
}

function createMockVDisk({
    index,
    groupId = MOCK_GROUP_ID,
    groupGeneration = MOCK_GROUP_GENERATION,
    state,
    diskSpace = EFlag.Green,
    frontQueues = EFlag.Green,
    capacityAlert,
    replicated = true,
    donorMode = false,
    pDiskState = TPDiskState.Normal,
    pDiskCapacityAlert,
    pDiskAllocatedPercent,
    pDiskHasWhiteboard = true,
    pDiskDriveStatus,
    pDiskDecommitStatus,
    pDiskMaintenanceStatus,
    pDiskDevice,
    pDiskRealtime,
    satisfactionRank,
    allocatedSizeMultiplier,
}: {
    index: number;
    groupId?: number;
    groupGeneration?: number;
    state: EVDiskState;
    diskSpace?: EFlag;
    frontQueues?: EFlag;
    capacityAlert?: ECapacityAlert;
    replicated?: boolean;
    donorMode?: boolean;
    pDiskState?: TPDiskState;
    pDiskCapacityAlert?: ECapacityAlert;
    pDiskAllocatedPercent?: number;
    pDiskHasWhiteboard?: boolean;
    pDiskDriveStatus?: EDriveStatus;
    pDiskDecommitStatus?: EDecommitStatus;
    pDiskMaintenanceStatus?: EMaintenanceStatus;
    pDiskDevice?: EFlag;
    pDiskRealtime?: EFlag;
    satisfactionRank?: {
        FreshRank?: {RankPercent: number; Flag: EFlag};
        LevelRank?: {RankPercent: number; Flag: EFlag};
    };
    allocatedSizeMultiplier?: number;
}): TStorageVDisk {
    const nodeId = MOCK_NODE_ID_BASE + index;
    const pDiskId = MOCK_PDISK_ID_BASE + index;
    const vDiskSlotId = MOCK_VDISK_SLOT_ID_BASE + index;
    const allocatedSize =
        state === EVDiskState.PDiskError
            ? 3 * MOCK_ALLOCATED_SIZE_BASE
            : MOCK_ALLOCATED_SIZE_BASE * (allocatedSizeMultiplier ?? index + 1);
    const availableSize = MOCK_SLOT_SIZE - allocatedSize;

    return {
        VDiskId: `${groupId}-${groupGeneration}-0-0-${index}`,
        NodeId: nodeId,
        AllocatedSize: String(allocatedSize),
        AvailableSize: String(availableSize),
        Status:
            state === EVDiskState.OK
                ? replicated
                    ? 'READY'
                    : 'REPLICATING'
                : state === EVDiskState.Initial
                  ? 'INIT_PENDING'
                  : 'ERROR',
        DiskSpace: diskSpace,
        PDisk: createMockPDisk(
            index,
            pDiskState,
            pDiskCapacityAlert,
            pDiskAllocatedPercent,
            pDiskHasWhiteboard,
            pDiskDriveStatus,
            pDiskDecommitStatus,
            pDiskMaintenanceStatus,
            pDiskDevice,
            pDiskRealtime,
        ),
        Whiteboard: {
            VDiskId: {
                GroupID: groupId,
                GroupGeneration: groupGeneration,
                Ring: 0,
                Domain: 0,
                VDisk: index,
            },
            PDiskId: pDiskId,
            VDiskSlotId: vDiskSlotId,
            Guid: String(8000000000000000000 + index),
            Kind: 'Default',
            NodeId: nodeId,
            Overall: state === EVDiskState.OK ? EFlag.Green : EFlag.Red,
            VDiskState: state,
            DiskSpace: diskSpace,
            Replicated: replicated,
            ReplicationProgress: replicated ? 1 : 0.42,
            ReplicationSecondsRemaining: replicated ? undefined : 3600,
            UnsyncedVDisks: replicated ? '0' : '2',
            AllocatedSize: String(allocatedSize),
            AvailableSize: String(availableSize),
            DonorMode: donorMode,
            FrontQueues: frontQueues,
            ReadThroughput: String((index + 1) * 1024 * 1024),
            WriteThroughput: String((index + 1) * 512 * 1024),
            StoragePoolName: 'mock-vdisk-states',
            CapacityAlert: capacityAlert,
            SatisfactionRank: satisfactionRank,
        },
    };
}

export function createMockStorageGroupsResponse(): StorageGroupsResponse {
    // Define VDisks with different combinations of State, CapacityAlert, FrontQueues, and SatisfactionRank
    // Covers all 6 EVDiskState values, various ECapacityAlert values, and multiple Fresh/Level Rank combinations
    const vDiskConfigs = [
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.GREEN,
            pDiskState: TPDiskState.Normal,
            pDiskCapacityAlert: ECapacityAlert.GREEN,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 10,
            pDiskDriveStatus: 'ACTIVE' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_NONE' as EDecommitStatus,
            pDiskMaintenanceStatus: 'NO_REQUEST' as EMaintenanceStatus,
            pDiskDevice: undefined,
            pDiskRealtime: undefined,
            frontQueues: EFlag.Green,
            diskSpace: EFlag.Green,
            satisfactionRank: {
                FreshRank: {RankPercent: 50, Flag: EFlag.Green},
                LevelRank: {RankPercent: 45, Flag: EFlag.Green},
            },
        },
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.CYAN,
            pDiskState: TPDiskState.Initial,
            pDiskCapacityAlert: ECapacityAlert.CYAN,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 20,
            pDiskDriveStatus: 'INACTIVE' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_IMMINENT' as EDecommitStatus,
            pDiskMaintenanceStatus: 'LONG_TERM_MAINTENANCE_PLANNED' as EMaintenanceStatus,
            pDiskDevice: EFlag.Yellow,
            pDiskRealtime: EFlag.Green,
            frontQueues: EFlag.Blue,
            diskSpace: EFlag.Green,
            satisfactionRank: {
                FreshRank: {RankPercent: 85, Flag: EFlag.Yellow},
                LevelRank: {RankPercent: 60, Flag: EFlag.Green},
            },
        },
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.YELLOW,
            pDiskState: TPDiskState.OpenFileError,
            pDiskCapacityAlert: ECapacityAlert.YELLOW,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 30,
            pDiskDriveStatus: 'TO_BE_REMOVED' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_PENDING' as EDecommitStatus,
            pDiskMaintenanceStatus: 'NO_NEW_VDISKS' as EMaintenanceStatus,
            pDiskDevice: EFlag.Orange,
            pDiskRealtime: EFlag.Yellow,
            frontQueues: EFlag.Yellow,
            diskSpace: EFlag.Yellow,
            satisfactionRank: {
                FreshRank: {RankPercent: 95, Flag: EFlag.Orange},
                LevelRank: {RankPercent: 88, Flag: EFlag.Yellow},
            },
        },
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.ORANGE,
            pDiskState: TPDiskState.Stopped,
            pDiskCapacityAlert: ECapacityAlert.ORANGE,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 40,
            pDiskDriveStatus: 'FAULTY' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_REJECTED' as EDecommitStatus,
            pDiskMaintenanceStatus: 'NO_REQUEST' as EMaintenanceStatus,
            pDiskDevice: EFlag.Red,
            pDiskRealtime: EFlag.Orange,
            frontQueues: EFlag.Orange,
            diskSpace: EFlag.Orange,
            satisfactionRank: {
                FreshRank: {RankPercent: 110, Flag: EFlag.Red},
                LevelRank: {RankPercent: 92, Flag: EFlag.Orange},
            },
        },
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.RED,
            pDiskState: TPDiskState.InitialFormatReadError,
            pDiskCapacityAlert: ECapacityAlert.RED,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 50,
            pDiskDriveStatus: 'BROKEN' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_NONE' as EDecommitStatus,
            pDiskMaintenanceStatus: 'LONG_TERM_MAINTENANCE_PLANNED' as EMaintenanceStatus,
            pDiskDevice: EFlag.Red,
            pDiskRealtime: EFlag.Red,
            frontQueues: EFlag.Red,
            diskSpace: EFlag.Red,
            satisfactionRank: {
                FreshRank: {RankPercent: 150, Flag: EFlag.Red},
                LevelRank: {RankPercent: 130, Flag: EFlag.Red},
            },
        },
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.LIGHTYELLOW,
            pDiskState: TPDiskState.InitialFormatRead,
            pDiskCapacityAlert: ECapacityAlert.LIGHTYELLOW,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 60,
            pDiskDriveStatus: 'UNKNOWN' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_NONE' as EDecommitStatus,
            pDiskMaintenanceStatus: 'NO_NEW_VDISKS' as EMaintenanceStatus,
            pDiskDevice: EFlag.Green,
            pDiskRealtime: EFlag.Red,
            frontQueues: EFlag.Yellow,
            diskSpace: EFlag.Yellow,
            satisfactionRank: {
                FreshRank: {RankPercent: 70, Flag: EFlag.Green},
                LevelRank: {RankPercent: 105, Flag: EFlag.Red},
            },
        },
        {
            state: EVDiskState.SyncGuidRecovery,
            capacityAlert: ECapacityAlert.LIGHTORANGE,
            pDiskState: TPDiskState.DeviceIoError,
            pDiskCapacityAlert: ECapacityAlert.LIGHTORANGE,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 70,
            pDiskDriveStatus: 'ACTIVE' as EDriveStatus,
            pDiskDecommitStatus: undefined,
            pDiskMaintenanceStatus: undefined,
            pDiskDevice: undefined,
            pDiskRealtime: EFlag.Green,
            frontQueues: EFlag.Yellow,
            diskSpace: EFlag.Yellow,
            satisfactionRank: {
                FreshRank: {RankPercent: 120, Flag: EFlag.Red},
                LevelRank: {RankPercent: 75, Flag: EFlag.Yellow},
            },
        },
        {
            state: EVDiskState.SyncGuidRecoveryError,
            capacityAlert: ECapacityAlert.PREORANGE,
            pDiskState: TPDiskState.ChunkQuotaError,
            pDiskCapacityAlert: ECapacityAlert.PREORANGE,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 80,
            pDiskDriveStatus: 'ACTIVE' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_IMMINENT' as EDecommitStatus,
            pDiskMaintenanceStatus: 'LONG_TERM_MAINTENANCE_PLANNED' as EMaintenanceStatus,
            pDiskDevice: EFlag.Green,
            pDiskRealtime: EFlag.Orange,
            frontQueues: EFlag.Orange,
            diskSpace: EFlag.Red,
            satisfactionRank: {
                FreshRank: {RankPercent: 55, Flag: EFlag.Green},
                LevelRank: {RankPercent: 98, Flag: EFlag.Orange},
            },
        },
        {
            state: EVDiskState.LocalRecoveryError,
            capacityAlert: ECapacityAlert.BLACK,
            pDiskState: TPDiskState.InitialSysLogParseError,
            pDiskCapacityAlert: ECapacityAlert.BLACK,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 90,
            pDiskDriveStatus: 'INACTIVE' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_PENDING' as EDecommitStatus,
            pDiskMaintenanceStatus: 'NO_NEW_VDISKS' as EMaintenanceStatus,
            pDiskDevice: EFlag.Grey,
            pDiskRealtime: EFlag.Green,
            frontQueues: EFlag.Grey,
            diskSpace: EFlag.Red,
            satisfactionRank: {
                FreshRank: {RankPercent: 90, Flag: EFlag.Orange},
                LevelRank: {RankPercent: 50, Flag: EFlag.Green},
            },
        },
        {
            state: EVDiskState.PDiskError,
            capacityAlert: undefined,
            pDiskState: TPDiskState.Normal,
            pDiskCapacityAlert: undefined,
            pDiskHasWhiteboard: false,
            pDiskAllocatedPercent: 50,
            pDiskDriveStatus: undefined,
            pDiskDecommitStatus: undefined,
            pDiskMaintenanceStatus: undefined,
            pDiskDevice: EFlag.Green,
            pDiskRealtime: EFlag.Green,
            frontQueues: EFlag.Red,
            diskSpace: EFlag.Red,
            satisfactionRank: undefined, // No data for this disk
        },
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.GREEN,
            pDiskState: TPDiskState.Normal,
            pDiskCapacityAlert: ECapacityAlert.GREEN,
            pDiskHasWhiteboard: true,
            pDiskAllocatedPercent: 75,
            pDiskDriveStatus: 'ACTIVE' as EDriveStatus,
            pDiskDecommitStatus: 'DECOMMIT_NONE' as EDecommitStatus,
            pDiskMaintenanceStatus: 'NO_REQUEST' as EMaintenanceStatus,
            pDiskDevice: EFlag.Green,
            pDiskRealtime: EFlag.Green,
            frontQueues: EFlag.Green,
            diskSpace: EFlag.Green,
            satisfactionRank: {
                FreshRank: {RankPercent: 40, Flag: EFlag.Green},
                LevelRank: {RankPercent: 35, Flag: EFlag.Green},
            },
        },
    ];

    // First group - without replication
    const firstGroupVDisks = vDiskConfigs.map((config, index) =>
        createMockVDisk({
            index,
            state: config.state,
            capacityAlert: config.capacityAlert,
            pDiskState: config.pDiskState,
            pDiskCapacityAlert: config.pDiskCapacityAlert,
            pDiskAllocatedPercent: config.pDiskAllocatedPercent,
            pDiskHasWhiteboard: config.pDiskHasWhiteboard,
            pDiskDriveStatus: config.pDiskDriveStatus,
            pDiskDecommitStatus: config.pDiskDecommitStatus,
            pDiskMaintenanceStatus: config.pDiskMaintenanceStatus,
            pDiskDevice: config.pDiskDevice,
            pDiskRealtime: config.pDiskRealtime,
            frontQueues: config.frontQueues,
            diskSpace: config.diskSpace,
            replicated: true,
            satisfactionRank: config.satisfactionRank,
            allocatedSizeMultiplier: index === ALL_GREEN_VDISK_INDEX ? 5 : undefined,
        }),
    );

    // Keep explicit no-data and partial-data cases visible during local disk coloring checks.
    delete firstGroupVDisks[MISSING_WHITEBOARD_VDISK_INDEX].Whiteboard;
    delete firstGroupVDisks[MISSING_FRONT_QUEUES_VDISK_INDEX].Whiteboard?.FrontQueues;
    delete firstGroupVDisks[MISSING_STATE_VDISK_INDEX].Whiteboard?.VDiskState;
    delete firstGroupVDisks[MISSING_FRESH_IMPAIRED_LEVEL_VDISK_INDEX].Whiteboard?.SatisfactionRank
        ?.FreshRank;
    delete firstGroupVDisks[MISSING_PDISK_STATE_INDEX].PDisk?.Whiteboard?.State;

    const bscOnlyPDisk = firstGroupVDisks.find(({PDisk}) => PDisk && !PDisk.Whiteboard)?.PDisk;
    if (bscOnlyPDisk) {
        bscOnlyPDisk.Status = 'INACTIVE';
    }

    // Second group - with replication (same disks but replicating)
    const replicatingGroupId = MOCK_GROUP_ID + 1;
    const replicatingGroupGeneration = 1;
    const replicatingGroupBaseIndex = 100;

    const secondGroupVDisks = vDiskConfigs.map((config, index) => {
        const replicatingVDisk = createMockVDisk({
            index,
            groupId: replicatingGroupId,
            groupGeneration: replicatingGroupGeneration,
            state: config.state,
            capacityAlert: config.capacityAlert,
            pDiskState: config.pDiskState,
            pDiskCapacityAlert: config.pDiskCapacityAlert,
            pDiskAllocatedPercent: config.pDiskAllocatedPercent,
            pDiskHasWhiteboard: config.pDiskHasWhiteboard,
            pDiskDriveStatus: config.pDiskDriveStatus,
            pDiskDecommitStatus: config.pDiskDecommitStatus,
            pDiskMaintenanceStatus: config.pDiskMaintenanceStatus,
            pDiskDevice: config.pDiskDevice,
            pDiskRealtime: config.pDiskRealtime,
            frontQueues: config.frontQueues,
            diskSpace: config.diskSpace,
            replicated: false,
            satisfactionRank: config.satisfactionRank,
            allocatedSizeMultiplier: index === ALL_GREEN_VDISK_INDEX ? 5 : undefined,
        });

        const donorVDisk = createMockVDisk({
            index: replicatingGroupBaseIndex + index,
            groupId: replicatingGroupId,
            groupGeneration: replicatingGroupGeneration,
            state: config.state,
            capacityAlert: config.capacityAlert,
            pDiskState: config.pDiskState,
            pDiskCapacityAlert: config.pDiskCapacityAlert,
            pDiskAllocatedPercent: config.pDiskAllocatedPercent,
            pDiskHasWhiteboard: config.pDiskHasWhiteboard,
            pDiskDriveStatus: config.pDiskDriveStatus,
            pDiskDecommitStatus: config.pDiskDecommitStatus,
            pDiskMaintenanceStatus: config.pDiskMaintenanceStatus,
            pDiskDevice: config.pDiskDevice,
            pDiskRealtime: config.pDiskRealtime,
            frontQueues: config.frontQueues,
            diskSpace: config.diskSpace,
            replicated: false,
            donorMode: true,
            satisfactionRank: config.satisfactionRank,
            allocatedSizeMultiplier: index === ALL_GREEN_VDISK_INDEX ? 5 : undefined,
        });

        // Update VDiskId for donor
        donorVDisk.VDiskId = `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${index + 100}`;
        if (donorVDisk.Whiteboard) {
            donorVDisk.Whiteboard.VDiskId = {
                GroupID: replicatingGroupId,
                GroupGeneration: replicatingGroupGeneration,
                Ring: 0,
                Domain: 0,
                VDisk: index + 100,
            };
        }

        return {
            ...replicatingVDisk,
            Donors: [donorVDisk],
        };
    });

    return {
        Version: 10,
        TotalGroups: 2,
        FoundGroups: 2,
        StorageGroups: [
            {
                GroupId: String(MOCK_GROUP_ID),
                GroupGeneration: String(MOCK_GROUP_GENERATION),
                PoolName: 'mock-vdisk-states',
                Kind: 'ssd',
                MediaType: 'ssd',
                ErasureSpecies: 'block-4-2',
                Overall: EFlag.Red,
                DiskSpace: EFlag.Red,
                AllocationUnits: '1',
                State: 'mock: all vdisk states',
                MissingDisks: '3',
                Used: String(MOCK_ALLOCATED_SIZE_BASE * 32),
                Limit: String(MOCK_SLOT_SIZE * 10),
                Available: String(MOCK_SLOT_SIZE * 7),
                Usage: 32,
                Read: String(64 * 1024 * 1024),
                Write: String(32 * 1024 * 1024),
                DiskSpaceUsage: 32,
                LatencyPutTabletLog: '1000',
                LatencyPutUserData: '2000',
                LatencyGetFast: '500',
                VDisks: firstGroupVDisks,
                MaxPDiskUsage: 70,
                MaxVDiskSlotUsage: 82,
                MaxVDiskRawUsage: 64,
                MaxNormalizedOccupancy: 0.58,
                CapacityAlert: ECapacityAlert.RED,
            },
            {
                GroupId: String(replicatingGroupId),
                GroupGeneration: String(replicatingGroupGeneration),
                PoolName: 'mock-replicating-disks',
                Kind: 'ssd',
                MediaType: 'ssd',
                ErasureSpecies: 'block-4-2',
                Overall: EFlag.Yellow,
                DiskSpace: EFlag.Yellow,
                AllocationUnits: '1',
                State: 'mock: all disks replicating',
                MissingDisks: '0',
                Used: String(MOCK_ALLOCATED_SIZE_BASE * 32),
                Limit: String(MOCK_SLOT_SIZE * 10),
                Available: String(MOCK_SLOT_SIZE * 7),
                Usage: 32,
                Read: String(64 * 1024 * 1024),
                Write: String(32 * 1024 * 1024),
                DiskSpaceUsage: 32,
                LatencyPutTabletLog: '1000',
                LatencyPutUserData: '2000',
                LatencyGetFast: '500',
                VDisks: secondGroupVDisks,
                MaxPDiskUsage: 70,
                MaxVDiskSlotUsage: 82,
                MaxVDiskRawUsage: 64,
                MaxNormalizedOccupancy: 0.58,
                CapacityAlert: ECapacityAlert.YELLOW,
            },
        ],
    };
}

const MOCK_NODE_GROUPS = [
    {name: 'mock-storage-group-1', vDisksPerPDisk: [8, 16, 24, 8]},
    {name: 'mock-storage-group-2', vDisksPerPDisk: [16, 24, 8, 16]},
    {name: 'mock-storage-group-3', vDisksPerPDisk: [24, 8, 16, 24]},
] as const;

export function createMockStorageNodesResponse(filterGroup?: string): TNodesInfo {
    const storageGroups = createMockStorageGroupsResponse().StorageGroups ?? [];
    const diskSources = storageGroups
        .flatMap((group) => group.VDisks ?? [])
        .filter((storageVDisk) => storageVDisk.Whiteboard && storageVDisk.PDisk?.Whiteboard);

    const groupedNodes = MOCK_NODE_GROUPS.map(({name, vDisksPerPDisk}, nodeIndex) => {
        const nodeId = MOCK_NODE_ID_BASE + nodeIndex;
        const pDisks: NonNullable<TNodeInfo['PDisks']> = [];
        const vDisks: NonNullable<TNodeInfo['VDisks']> = [];

        vDisksPerPDisk.forEach((vDiskCount, pDiskIndex) => {
            const pDiskId = MOCK_PDISK_ID_BASE + nodeIndex * vDisksPerPDisk.length + pDiskIndex;
            const pDiskSource =
                diskSources[(nodeIndex * vDisksPerPDisk.length + pDiskIndex) % diskSources.length]
                    ?.PDisk;
            const pDiskWhiteboard = pDiskSource?.Whiteboard;

            if (!pDiskWhiteboard) {
                return;
            }

            const isNoDataPDisk = nodeIndex === 0 && pDiskIndex < 2;
            const hasBSCStatuses = !isNoDataPDisk || pDiskIndex === 1;
            const bscStatuses = {
                DriveStatus: pDiskSource.Status,
                DecommitStatus: pDiskSource.DecommitStatus,
                MaintenanceStatus: pDiskSource.MaintenanceStatus,
            };
            const pDiskWithBSCStatuses = {
                ...(isNoDataPDisk ? {} : pDiskWhiteboard),
                ...(hasBSCStatuses ? bscStatuses : {}),
                NodeId: nodeId,
                PDiskId: pDiskId,
                Category: pDiskWhiteboard.Category,
                Path: `/mock/nodes/${nodeId}/pdisk-${pDiskId}`,
                TotalSize: pDiskSource.TotalSize,
                AvailableSize: pDiskSource.AvailableSize,
                ExpectedSlotCount: vDiskCount,
                NumActiveSlots: vDiskCount,
            };
            pDisks.push(pDiskWithBSCStatuses);

            for (let vDiskIndex = 0; vDiskIndex < vDiskCount; vDiskIndex++) {
                const vDiskSource =
                    diskSources[
                        (nodeIndex * 24 + pDiskIndex * 8 + vDiskIndex) % diskSources.length
                    ];
                const vDiskWhiteboard = vDiskSource?.Whiteboard;

                if (!vDiskSource || !vDiskWhiteboard) {
                    continue;
                }

                const allocatedSize = Math.round(
                    (MOCK_SLOT_SIZE * (vDiskIndex + 1)) / (vDiskCount + 1),
                );
                const vDiskSlotId =
                    MOCK_VDISK_SLOT_ID_BASE + nodeIndex * 1000 + pDiskIndex * 100 + vDiskIndex;
                const isNoDataVDisk = nodeIndex === 0 && pDiskIndex < 2 && vDiskIndex === 0;

                const vDisk = {
                    ...(isNoDataVDisk ? {} : vDiskWhiteboard),
                    ...(isNoDataVDisk && pDiskIndex === 1 ? {Status: 'ERROR' as const} : {}),
                    VDiskId: isNoDataVDisk
                        ? undefined
                        : {
                              GroupID: MOCK_GROUP_ID + nodeIndex,
                              GroupGeneration: MOCK_GROUP_GENERATION,
                              Ring: pDiskIndex,
                              Domain: 0,
                              VDisk: vDiskIndex,
                          },
                    NodeId: nodeId,
                    PDiskId: pDiskId,
                    VDiskSlotId: vDiskSlotId,
                    Guid: String(vDiskSlotId),
                    AllocatedSize: String(allocatedSize),
                    AvailableSize: String(MOCK_SLOT_SIZE - allocatedSize),
                    Donors: isNoDataVDisk
                        ? undefined
                        : vDiskSource.Donors?.flatMap((donor) =>
                              donor.Whiteboard ? [donor.Whiteboard] : [],
                          ),
                };
                vDisks.push(vDisk);
            }
        });

        const node: TNodeInfo = {
            NodeId: nodeId,
            SystemState: {
                NodeId: nodeId,
                Host: `mock-storage-node-${nodeId}.ydb`,
                NodeName: `mock-storage-node-${nodeId}`,
                Roles: ['Storage'],
                SystemState: EFlag.Green,
                Location: {DataCenter: 'mock-dc', Rack: `mock-rack-${nodeIndex + 1}`},
            },
            PDisks: pDisks,
            VDisks: vDisks,
            UptimeSeconds: 60 * 60,
            Disconnected: false,
            MaxPDiskUsage: 70,
            MaxVDiskSlotUsage: 82,
            MaxVDiskRawUsage: 64,
            CapacityAlert: ECapacityAlert.RED,
        };

        return {name, node};
    });
    const nodes = groupedNodes
        .filter(({name}) => filterGroup === undefined || name === filterGroup)
        .map(({node}) => node);

    return {
        Overall: EFlag.Red,
        Nodes: nodes,
        NodeGroups: groupedNodes.map(({name}) => ({GroupName: name, NodeCount: 1})),
        TotalNodes: String(nodes.length),
        FoundNodes: String(nodes.length),
        MaximumSlotsPerDisk: '24',
        MaximumDisksPerNode: '4',
    };
}
