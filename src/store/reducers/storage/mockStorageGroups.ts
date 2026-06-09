import {ECapacityAlert, EFlag} from '../../../types/api/enums';
import {TPDiskState} from '../../../types/api/pdisk';
import type {StorageGroupsResponse, TStorageVDisk} from '../../../types/api/storage';
import {EVDiskState} from '../../../types/api/vdisk';

const MOCK_GROUP_ID = 9000000000;
const MOCK_GROUP_GENERATION = 1;
const MOCK_SLOT_SIZE = 10 * 1024 ** 3;
const MOCK_ALLOCATED_SIZE_BASE = 1024 ** 3;
const MOCK_NODE_ID_BASE = 7000;
const MOCK_PDISK_ID_BASE = 100;
const MOCK_VDISK_SLOT_ID_BASE = 200;

function createMockPDisk(index: number, state = TPDiskState.Normal): TStorageVDisk['PDisk'] {
    return {
        PDiskId: `${MOCK_NODE_ID_BASE + index}-${MOCK_PDISK_ID_BASE + index}`,
        Path: `/mock/vdisks-state/pdisk-${index}`,
        Type: index % 3 === 0 ? 'nvme' : index % 3 === 1 ? 'ssd' : 'hdd',
        Guid: String(9000000000000000000 + index),
        TotalSize: String(MOCK_SLOT_SIZE * 16),
        AvailableSize: String(MOCK_SLOT_SIZE * 12),
        Status: 'ACTIVE',
        DiskSpace: EFlag.Green,
        SlotSize: String(MOCK_SLOT_SIZE),
        SlotCount: '16',
        Whiteboard: {
            PDiskId: MOCK_PDISK_ID_BASE + index,
            NodeId: MOCK_NODE_ID_BASE + index,
            Path: `/mock/vdisks-state/pdisk-${index}`,
            Guid: String(9000000000000000000 + index),
            Category: String(index % 3),
            AvailableSize: String(MOCK_SLOT_SIZE * 12),
            TotalSize: String(MOCK_SLOT_SIZE * 16),
            State: state,
            Device: state === TPDiskState.Normal ? EFlag.Green : EFlag.Red,
            Realtime: EFlag.Green,
            StateFlag: state === TPDiskState.Normal ? EFlag.Green : EFlag.Red,
            Overall: state === TPDiskState.Normal ? EFlag.Green : EFlag.Red,
            EnforcedDynamicSlotSize: String(MOCK_SLOT_SIZE),
            ExpectedSlotCount: 16,
            NumActiveSlots: 1,
        },
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
    satisfactionRank,
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
    satisfactionRank?: {
        FreshRank?: {RankPercent: number; Flag: EFlag};
        LevelRank?: {RankPercent: number; Flag: EFlag};
    };
}): TStorageVDisk {
    const nodeId = MOCK_NODE_ID_BASE + index;
    const pDiskId = MOCK_PDISK_ID_BASE + index;
    const vDiskSlotId = MOCK_VDISK_SLOT_ID_BASE + index;
    const allocatedSize = MOCK_ALLOCATED_SIZE_BASE * (index + 1);
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
        PDisk: createMockPDisk(index, pDiskState),
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
    // Define 10 VDisks with different combinations of State, CapacityAlert, FrontQueues, and SatisfactionRank
    // Covers all 6 EVDiskState values, various ECapacityAlert values, and multiple Fresh/Level Rank combinations
    const vDiskConfigs = [
        {
            state: EVDiskState.OK,
            capacityAlert: ECapacityAlert.GREEN,
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
            frontQueues: EFlag.Red,
            diskSpace: EFlag.Red,
            satisfactionRank: {
                FreshRank: {RankPercent: 150, Flag: EFlag.Red},
                LevelRank: {RankPercent: 130, Flag: EFlag.Red},
            },
        },
        {
            state: EVDiskState.Initial,
            capacityAlert: ECapacityAlert.LIGHTYELLOW,
            frontQueues: EFlag.Green,
            diskSpace: EFlag.Green,
            satisfactionRank: {
                FreshRank: {RankPercent: 70, Flag: EFlag.Green},
                LevelRank: {RankPercent: 105, Flag: EFlag.Red},
            },
        },
        {
            state: EVDiskState.SyncGuidRecovery,
            capacityAlert: ECapacityAlert.LIGHTORANGE,
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
            frontQueues: EFlag.Red,
            diskSpace: EFlag.Red,
            satisfactionRank: undefined, // No data for this disk
        },
    ];

    // First group - without replication
    const firstGroupVDisks = vDiskConfigs.map((config, index) =>
        createMockVDisk({
            index,
            state: config.state,
            capacityAlert: config.capacityAlert,
            frontQueues: config.frontQueues,
            diskSpace: config.diskSpace,
            replicated: true,
            satisfactionRank: config.satisfactionRank,
        }),
    );

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
            frontQueues: config.frontQueues,
            diskSpace: config.diskSpace,
            replicated: false,
            satisfactionRank: config.satisfactionRank,
        });

        const donorVDisk = createMockVDisk({
            index: replicatingGroupBaseIndex + index,
            groupId: replicatingGroupId,
            groupGeneration: replicatingGroupGeneration,
            state: config.state,
            capacityAlert: config.capacityAlert,
            frontQueues: config.frontQueues,
            diskSpace: config.diskSpace,
            replicated: false,
            donorMode: true,
            satisfactionRank: config.satisfactionRank,
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
