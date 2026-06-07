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

const vDiskStates = Object.values(EVDiskState);

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
    state,
    diskSpace = EFlag.Green,
    frontQueues = EFlag.Green,
    replicated = true,
    donorMode = false,
    pDiskState = TPDiskState.Normal,
}: {
    index: number;
    state: EVDiskState;
    diskSpace?: EFlag;
    frontQueues?: EFlag;
    replicated?: boolean;
    donorMode?: boolean;
    pDiskState?: TPDiskState;
}): TStorageVDisk {
    const nodeId = MOCK_NODE_ID_BASE + index;
    const pDiskId = MOCK_PDISK_ID_BASE + index;
    const vDiskSlotId = MOCK_VDISK_SLOT_ID_BASE + index;
    const allocatedSize = MOCK_ALLOCATED_SIZE_BASE * (index + 1);
    const availableSize = MOCK_SLOT_SIZE - allocatedSize;

    // Cycle through different capacity alert values for VDisks
    const capacityAlerts = [
        ECapacityAlert.GREEN,
        ECapacityAlert.CYAN,
        ECapacityAlert.LIGHTYELLOW,
        ECapacityAlert.YELLOW,
        ECapacityAlert.LIGHTORANGE,
        ECapacityAlert.PREORANGE,
        ECapacityAlert.ORANGE,
        ECapacityAlert.RED,
        ECapacityAlert.BLACK,
    ];
    const capacityAlert = capacityAlerts[index % capacityAlerts.length];

    return {
        VDiskId: `${MOCK_GROUP_ID}-${MOCK_GROUP_GENERATION}-0-0-${index}`,
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
                GroupID: MOCK_GROUP_ID,
                GroupGeneration: MOCK_GROUP_GENERATION,
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
            SatisfactionRank: {
                FreshRank: {
                    RankPercent: state === EVDiskState.OK ? 80 : 140,
                    Flag: state === EVDiskState.OK ? EFlag.Green : EFlag.Red,
                },
                LevelRank: {
                    RankPercent: state === EVDiskState.OK ? 75 : 120,
                    Flag: state === EVDiskState.OK ? EFlag.Green : EFlag.Yellow,
                },
            },
        },
    };
}

export function createMockStorageGroupsResponse(): StorageGroupsResponse {
    const stateVDisks = vDiskStates.map((state, index) =>
        createMockVDisk({
            index,
            state,
            diskSpace:
                state === EVDiskState.OK
                    ? EFlag.Green
                    : state === EVDiskState.SyncGuidRecovery
                      ? EFlag.Yellow
                      : EFlag.Red,
            frontQueues: state === EVDiskState.OK ? EFlag.Green : EFlag.Yellow,
        }),
    );

    const criticalSpaceVDisk = createMockVDisk({
        index: stateVDisks.length,
        state: EVDiskState.OK,
        diskSpace: EFlag.Orange,
        frontQueues: EFlag.Orange,
    });

    const blackCapacityAlertVDisk = createMockVDisk({
        index: stateVDisks.length + 1,
        state: EVDiskState.OK,
    });
    // Override capacity alert to BLACK
    if (blackCapacityAlertVDisk.Whiteboard) {
        blackCapacityAlertVDisk.Whiteboard.CapacityAlert = ECapacityAlert.BLACK;
    }

    // VDisk without CapacityAlert - should show N/A in Space mode
    const noCapacityAlertVDisk = createMockVDisk({
        index: stateVDisks.length + 2,
        state: EVDiskState.OK,
    });
    if (noCapacityAlertVDisk.Whiteboard) {
        noCapacityAlertVDisk.Whiteboard.CapacityAlert = undefined;
    }

    const missingStateVDisk: TStorageVDisk = {
        ...createMockVDisk({
            index: stateVDisks.length + 1,
            state: EVDiskState.OK,
        }),
        VDiskId: `${MOCK_GROUP_ID}-${MOCK_GROUP_GENERATION}-0-0-${stateVDisks.length + 1}`,
        Status: 'ERROR',
        Whiteboard: {
            ...createMockVDisk({
                index: stateVDisks.length + 1,
                state: EVDiskState.OK,
            }).Whiteboard,
            VDiskState: undefined,
            Overall: EFlag.Grey,
            DiskSpace: EFlag.Grey,
        },
    };

    // Second group with all disks in replication state
    const replicatingGroupId = MOCK_GROUP_ID + 1;
    const replicatingGroupGeneration = 1;
    const replicatingGroupBaseIndex = stateVDisks.length + 10;

    const replicatingStateVDisks = vDiskStates.map((state, index) => {
        const replicatingVDisk = createMockVDisk({
            index,
            state,
            diskSpace:
                state === EVDiskState.OK
                    ? EFlag.Green
                    : state === EVDiskState.SyncGuidRecovery
                      ? EFlag.Yellow
                      : EFlag.Red,
            frontQueues: state === EVDiskState.OK ? EFlag.Green : EFlag.Yellow,
            replicated: false,
        });

        const donorVDisk = createMockVDisk({
            index: replicatingGroupBaseIndex + index,
            state,
            diskSpace:
                state === EVDiskState.OK
                    ? EFlag.Green
                    : state === EVDiskState.SyncGuidRecovery
                      ? EFlag.Yellow
                      : EFlag.Red,
            frontQueues: state === EVDiskState.OK ? EFlag.Green : EFlag.Yellow,
            replicated: false,
            donorMode: true,
        });

        // Update VDiskId to use the new group ID
        replicatingVDisk.VDiskId = `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${index}`;
        if (replicatingVDisk.Whiteboard) {
            replicatingVDisk.Whiteboard.VDiskId = {
                GroupID: replicatingGroupId,
                GroupGeneration: replicatingGroupGeneration,
                Ring: 0,
                Domain: 0,
                VDisk: index,
            };
        }

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

    const replicatingBlackCapacityAlertVDisk = createMockVDisk({
        index: stateVDisks.length,
        state: EVDiskState.OK,
        replicated: false,
    });
    replicatingBlackCapacityAlertVDisk.VDiskId = `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${vDiskStates.length}`;
    if (replicatingBlackCapacityAlertVDisk.Whiteboard) {
        replicatingBlackCapacityAlertVDisk.Whiteboard.VDiskId = {
            GroupID: replicatingGroupId,
            GroupGeneration: replicatingGroupGeneration,
            Ring: 0,
            Domain: 0,
            VDisk: vDiskStates.length,
        };
        replicatingBlackCapacityAlertVDisk.Whiteboard.CapacityAlert = ECapacityAlert.BLACK;
    }

    const replicatingCriticalSpaceVDisk = createMockVDisk({
        index: stateVDisks.length,
        state: EVDiskState.OK,
        diskSpace: EFlag.Orange,
        frontQueues: EFlag.Orange,
        replicated: false,
    });
    replicatingCriticalSpaceVDisk.VDiskId = `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${vDiskStates.length}`;
    if (replicatingCriticalSpaceVDisk.Whiteboard) {
        replicatingCriticalSpaceVDisk.Whiteboard.VDiskId = {
            GroupID: replicatingGroupId,
            GroupGeneration: replicatingGroupGeneration,
            Ring: 0,
            Domain: 0,
            VDisk: vDiskStates.length,
        };
    }

    const replicatingMissingStateVDisk: TStorageVDisk = {
        ...createMockVDisk({
            index: stateVDisks.length + 1,
            state: EVDiskState.OK,
            replicated: false,
        }),
        VDiskId: `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${vDiskStates.length + 1}`,
        Status: 'REPLICATING',
        Whiteboard: {
            ...createMockVDisk({
                index: stateVDisks.length + 1,
                state: EVDiskState.OK,
                replicated: false,
            }).Whiteboard,
            VDiskId: {
                GroupID: replicatingGroupId,
                GroupGeneration: replicatingGroupGeneration,
                Ring: 0,
                Domain: 0,
                VDisk: vDiskStates.length + 1,
            },
            VDiskState: undefined,
            Overall: EFlag.Grey,
            DiskSpace: EFlag.Grey,
        },
    };

    const replicatingVDisks = [
        ...replicatingStateVDisks,
        replicatingBlackCapacityAlertVDisk,
        replicatingCriticalSpaceVDisk,
        replicatingMissingStateVDisk,
    ];

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
                MissingDisks: String(vDiskStates.length - 1),
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
                VDisks: [
                    ...stateVDisks,
                    criticalSpaceVDisk,
                    blackCapacityAlertVDisk,
                    noCapacityAlertVDisk,
                    missingStateVDisk,
                ],
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
                VDisks: replicatingVDisks,
                MaxPDiskUsage: 70,
                MaxVDiskSlotUsage: 82,
                MaxVDiskRawUsage: 64,
                MaxNormalizedOccupancy: 0.58,
                CapacityAlert: ECapacityAlert.YELLOW,
            },
        ],
    };
}
