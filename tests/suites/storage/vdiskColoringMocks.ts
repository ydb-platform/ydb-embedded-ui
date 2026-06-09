import type {Page} from '@playwright/test';

export const DATABASE = '/Root';
export const STORAGE_POOL_NAME = 'static';

const MOCK_GROUP_ID = 2181038080;
const MOCK_GROUP_GENERATION = 1;
const MOCK_SLOT_SIZE = 10 * 1024 ** 3; // 10 GB
const MOCK_ALLOCATED_SIZE_BASE = 1024 ** 3; // 1 GB
const MOCK_NODE_ID_BASE = 7000;
const MOCK_PDISK_ID_BASE = 100;
const MOCK_VDISK_SLOT_ID_BASE = 200;

/**
 * VDisk states for State mode testing
 * Must match EVDiskState enum values
 */
export const VDISK_STATES = {
    OK: 'OK',
    INITIAL: 'Initial',
    PDISK_ERROR: 'PDiskError',
    LOCAL_RECOVERY_ERROR: 'LocalRecoveryError',
    SYNC_GUID_RECOVERY_ERROR: 'SyncGuidRecoveryError',
} as const;

/**
 * Capacity alerts for Space mode testing
 * Must match ECapacityAlert enum values
 */
export const CAPACITY_ALERTS = {
    GREEN: 'GREEN',
    CYAN: 'CYAN',
    LIGHT_YELLOW: 'LIGHT_YELLOW',
    YELLOW: 'YELLOW',
    LIGHT_ORANGE: 'LIGHT_ORANGE',
    PRE_ORANGE: 'PRE_ORANGE',
    ORANGE: 'ORANGE',
    RED: 'RED',
    BLACK: 'BLACK',
} as const;

/**
 * Flag colors for disk space and overall status
 */
const FLAG = {
    GREEN: 'Green',
    YELLOW: 'Yellow',
    ORANGE: 'Orange',
    RED: 'Red',
    GREY: 'Grey',
} as const;

/**
 * PDisk states
 */
const PDISK_STATE = {
    NORMAL: 'Normal',
    INITIAL: 'Initial',
    INIT_PENDING: 'InitPending',
    BROKEN: 'Broken',
} as const;

interface CreateMockPDiskOptions {
    index: number;
    state?: string;
}

/**
 * Create a mock PDisk with realistic structure
 */
function createMockPDisk({index, state = PDISK_STATE.NORMAL}: CreateMockPDiskOptions) {
    const nodeId = MOCK_NODE_ID_BASE + index;
    const pDiskId = MOCK_PDISK_ID_BASE + index;

    return {
        PDiskId: `${nodeId}-${pDiskId}`,
        Path: `/mock/vdisks-state/pdisk-${index}`,
        Type: index % 3 === 0 ? 'nvme' : index % 3 === 1 ? 'ssd' : 'hdd',
        Guid: String(9000000000000000000 + index),
        TotalSize: String(MOCK_SLOT_SIZE * 16),
        AvailableSize: String(MOCK_SLOT_SIZE * 12),
        Status: 'ACTIVE',
        DiskSpace: state === PDISK_STATE.NORMAL ? FLAG.GREEN : FLAG.RED,
        SlotSize: String(MOCK_SLOT_SIZE),
        SlotCount: '16',
        Whiteboard: {
            PDiskId: pDiskId,
            NodeId: nodeId,
            Path: `/mock/vdisks-state/pdisk-${index}`,
            Guid: String(9000000000000000000 + index),
            Category: String(index % 3),
            AvailableSize: String(MOCK_SLOT_SIZE * 12),
            TotalSize: String(MOCK_SLOT_SIZE * 16),
            State: state,
            Device: state === PDISK_STATE.NORMAL ? FLAG.GREEN : FLAG.RED,
            Realtime: FLAG.GREEN,
            StateFlag: state === PDISK_STATE.NORMAL ? FLAG.GREEN : FLAG.RED,
            Overall: state === PDISK_STATE.NORMAL ? FLAG.GREEN : FLAG.RED,
            EnforcedDynamicSlotSize: String(MOCK_SLOT_SIZE),
            ExpectedSlotCount: 16,
            NumActiveSlots: 1,
        },
    };
}

interface CreateMockVDiskOptions {
    index: number;
    vDiskState?: string;
    diskSpace?: string;
    frontQueues?: string;
    replicated?: boolean;
    donorMode?: boolean;
    pDiskState?: string;
    capacityAlert?: string;
}

/**
 * Create a mock VDisk with realistic structure matching backend response
 */
function createMockVDisk({
    index,
    vDiskState = VDISK_STATES.OK,
    diskSpace = FLAG.GREEN,
    frontQueues = FLAG.GREEN,
    replicated = true,
    donorMode = false,
    pDiskState = PDISK_STATE.NORMAL,
    capacityAlert = CAPACITY_ALERTS.GREEN,
}: CreateMockVDiskOptions): any {
    const nodeId = MOCK_NODE_ID_BASE + index;
    const pDiskId = MOCK_PDISK_ID_BASE + index;
    const vDiskSlotId = MOCK_VDISK_SLOT_ID_BASE + index;
    const allocatedSize = MOCK_ALLOCATED_SIZE_BASE * (index + 1);
    const availableSize = MOCK_SLOT_SIZE - allocatedSize;

    return {
        VDiskId: `${MOCK_GROUP_ID}-${MOCK_GROUP_GENERATION}-0-0-${index}`,
        NodeId: nodeId,
        AllocatedSize: String(allocatedSize),
        AvailableSize: String(availableSize),
        Status:
            vDiskState === VDISK_STATES.OK
                ? replicated
                    ? 'READY'
                    : 'REPLICATING'
                : vDiskState === VDISK_STATES.INITIAL
                  ? 'INIT_PENDING'
                  : 'ERROR',
        DiskSpace: diskSpace,
        PDisk: createMockPDisk({index, state: pDiskState}),
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
            Overall: vDiskState === VDISK_STATES.OK ? FLAG.GREEN : FLAG.RED,
            VDiskState: vDiskState,
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
            StoragePoolName: STORAGE_POOL_NAME,
            CapacityAlert: capacityAlert,
            SatisfactionRank: {
                FreshRank: {
                    RankPercent: vDiskState === VDISK_STATES.OK ? 80 : 140,
                    Flag: vDiskState === VDISK_STATES.OK ? FLAG.GREEN : FLAG.RED,
                },
                LevelRank: {
                    RankPercent: vDiskState === VDISK_STATES.OK ? 75 : 120,
                    Flag: vDiskState === VDISK_STATES.OK ? FLAG.GREEN : FLAG.YELLOW,
                },
            },
        },
    };
}

/**
 * Create storage groups response with VDisks in different states
 * First group: all replicated (no replication in progress)
 * Second group: all replicating (with donors)
 */
export function createStorageGroupsWithStates() {
    // First group: all replicated VDisks (no blue striped, no donors)
    const replicatedVDisks = [
        // OK state - replicated (Green)
        createMockVDisk({
            index: 0,
            vDiskState: VDISK_STATES.OK,
            replicated: true,
        }),
        // Initial state - replicated (Yellow with Clock icon)
        createMockVDisk({
            index: 1,
            vDiskState: VDISK_STATES.INITIAL,
            diskSpace: FLAG.YELLOW,
            frontQueues: FLAG.YELLOW,
            replicated: true,
        }),
        // PDiskError - replicated (Red with CircleExclamation)
        createMockVDisk({
            index: 2,
            vDiskState: VDISK_STATES.PDISK_ERROR,
            diskSpace: FLAG.RED,
            frontQueues: FLAG.RED,
            replicated: true,
        }),
        // LocalRecoveryError - replicated (Solid Red with CircleXmark)
        createMockVDisk({
            index: 3,
            vDiskState: VDISK_STATES.LOCAL_RECOVERY_ERROR,
            diskSpace: FLAG.RED,
            frontQueues: FLAG.RED,
            replicated: true,
        }),
        // SyncGuidRecoveryError - replicated (Solid Red with CircleXmark)
        createMockVDisk({
            index: 4,
            vDiskState: VDISK_STATES.SYNC_GUID_RECOVERY_ERROR,
            diskSpace: FLAG.RED,
            frontQueues: FLAG.RED,
            replicated: true,
        }),
    ];

    // N/A state - undefined VDiskState (Grey with N/A text)
    const naStateVDisk = createMockVDisk({
        index: 5,
        vDiskState: VDISK_STATES.OK,
        replicated: true,
    });
    if (naStateVDisk.Whiteboard) {
        naStateVDisk.Whiteboard.VDiskState = undefined;
        naStateVDisk.Whiteboard.Overall = FLAG.GREY;
        naStateVDisk.Whiteboard.DiskSpace = FLAG.GREY;
    }
    naStateVDisk.Status = 'ERROR';

    // Second group: all replicating VDisks with donors
    const replicatingGroupId = MOCK_GROUP_ID + 1;
    const replicatingGroupGeneration = 1;

    const replicatingVDisks = [
        VDISK_STATES.OK,
        VDISK_STATES.INITIAL,
        VDISK_STATES.PDISK_ERROR,
        VDISK_STATES.LOCAL_RECOVERY_ERROR,
        VDISK_STATES.SYNC_GUID_RECOVERY_ERROR,
    ].map((state, index) => {
        const diskSpace =
            state === VDISK_STATES.OK
                ? FLAG.GREEN
                : state === VDISK_STATES.INITIAL
                  ? FLAG.YELLOW
                  : FLAG.RED;
        const frontQueues =
            state === VDISK_STATES.OK
                ? FLAG.GREEN
                : state === VDISK_STATES.INITIAL
                  ? FLAG.YELLOW
                  : FLAG.RED;

        const vDisk = createMockVDisk({
            index: 100 + index,
            vDiskState: state,
            diskSpace,
            frontQueues,
            replicated: false,
        });

        const donor = createMockVDisk({
            index: 200 + index,
            vDiskState: state,
            diskSpace,
            frontQueues,
            replicated: false,
            donorMode: true,
        });

        // Update VDiskId to use the replicating group ID
        vDisk.VDiskId = `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${index}`;
        if (vDisk.Whiteboard) {
            vDisk.Whiteboard.VDiskId = {
                GroupID: replicatingGroupId,
                GroupGeneration: replicatingGroupGeneration,
                Ring: 0,
                Domain: 0,
                VDisk: index,
            };
        }

        donor.VDiskId = `${replicatingGroupId}-${replicatingGroupGeneration}-0-0-${index + 100}`;
        if (donor.Whiteboard) {
            donor.Whiteboard.VDiskId = {
                GroupID: replicatingGroupId,
                GroupGeneration: replicatingGroupGeneration,
                Ring: 0,
                Domain: 0,
                VDisk: index + 100,
            };
        }

        return {
            ...vDisk,
            Donors: [donor],
        };
    });

    return {
        StorageGroups: [
            {
                GroupId: String(MOCK_GROUP_ID),
                GroupGeneration: String(MOCK_GROUP_GENERATION),
                PoolName: STORAGE_POOL_NAME,
                Kind: 'ssd',
                MediaType: 'ssd',
                ErasureSpecies: 'mirror-3-dc',
                Overall: FLAG.RED,
                DiskSpace: FLAG.RED,
                AllocationUnits: '1',
                State: 'mock: all replicated vdisks',
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
                VDisks: [...replicatedVDisks, naStateVDisk],
            },
            {
                GroupId: String(replicatingGroupId),
                GroupGeneration: String(replicatingGroupGeneration),
                PoolName: STORAGE_POOL_NAME,
                Kind: 'ssd',
                MediaType: 'ssd',
                ErasureSpecies: 'mirror-3-dc',
                Overall: FLAG.YELLOW,
                DiskSpace: FLAG.YELLOW,
                AllocationUnits: '1',
                State: 'mock: all replicating vdisks with donors',
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
            },
        ],
    };
}

/**
 * Create storage groups response with VDisks in different space states
 */
export function createStorageGroupsWithSpaceStates() {
    const capacityAlerts = [
        CAPACITY_ALERTS.GREEN,
        CAPACITY_ALERTS.CYAN,
        CAPACITY_ALERTS.LIGHT_YELLOW,
        CAPACITY_ALERTS.YELLOW,
        CAPACITY_ALERTS.LIGHT_ORANGE,
        CAPACITY_ALERTS.PRE_ORANGE,
        CAPACITY_ALERTS.ORANGE,
        CAPACITY_ALERTS.RED,
        CAPACITY_ALERTS.BLACK,
    ];

    const vDisks = capacityAlerts.map((capacityAlert, index) =>
        createMockVDisk({
            index,
            vDiskState: VDISK_STATES.OK,
            capacityAlert,
            replicated: true,
        }),
    );

    return {
        StorageGroups: [
            {
                GroupId: String(MOCK_GROUP_ID),
                GroupGeneration: String(MOCK_GROUP_GENERATION),
                PoolName: STORAGE_POOL_NAME,
                Kind: 'ssd',
                MediaType: 'ssd',
                ErasureSpecies: 'mirror-3-dc',
                Overall: FLAG.GREEN,
                DiskSpace: FLAG.GREEN,
                AllocationUnits: '1',
                State: 'mock: all capacity alerts',
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
                VDisks: vDisks,
            },
        ],
    };
}

/**
 * Create storage groups with space states + replication variants
 */
export function createStorageGroupsWithSpaceAndReplication() {
    const vDisks = [
        // GREEN replicated
        createMockVDisk({
            index: 0,
            capacityAlert: CAPACITY_ALERTS.GREEN,
            replicated: true,
        }),
        // GREEN not replicated (striped)
        createMockVDisk({
            index: 1,
            capacityAlert: CAPACITY_ALERTS.GREEN,
            replicated: false,
        }),
        // YELLOW replicated
        createMockVDisk({
            index: 2,
            capacityAlert: CAPACITY_ALERTS.YELLOW,
            replicated: true,
        }),
        // YELLOW not replicated (striped)
        createMockVDisk({
            index: 3,
            capacityAlert: CAPACITY_ALERTS.YELLOW,
            replicated: false,
        }),
        // RED replicated
        createMockVDisk({
            index: 4,
            capacityAlert: CAPACITY_ALERTS.RED,
            replicated: true,
        }),
        // RED not replicated (striped)
        createMockVDisk({
            index: 5,
            capacityAlert: CAPACITY_ALERTS.RED,
            replicated: false,
        }),
        // BLACK replicated
        createMockVDisk({
            index: 6,
            capacityAlert: CAPACITY_ALERTS.BLACK,
            replicated: true,
        }),
        // BLACK not replicated (special striped pattern)
        createMockVDisk({
            index: 7,
            capacityAlert: CAPACITY_ALERTS.BLACK,
            replicated: false,
        }),
    ];

    return {
        StorageGroups: [
            {
                GroupId: String(MOCK_GROUP_ID),
                GroupGeneration: String(MOCK_GROUP_GENERATION),
                PoolName: STORAGE_POOL_NAME,
                Kind: 'ssd',
                MediaType: 'ssd',
                ErasureSpecies: 'mirror-3-dc',
                Overall: FLAG.GREEN,
                DiskSpace: FLAG.GREEN,
                AllocationUnits: '1',
                State: 'mock: space with replication',
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
                VDisks: vDisks,
            },
        ],
    };
}

async function setupMonitoringUserMock(page: Page) {
    await page.route('**/viewer/json/whoami*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                UserID: 'e2e-vdisk-coloring-user',
                IsMonitoringAllowed: true,
                IsViewerAllowed: true,
            }),
        });
    });
}

async function setupCapabilitiesMock(page: Page) {
    await page.route('**/viewer/capabilities*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                Database: DATABASE,
                Capabilities: {
                    '/storage/groups': 10,
                    '/viewer/nodes': 20,
                },
            }),
        });
    });
}

async function setupNodeInfoMock(page: Page) {
    await page.route('**/viewer/json/sysinfo?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                SystemStateInfo: [
                    {
                        NodeId: MOCK_NODE_ID_BASE,
                        Host: 'storage-node-01.ydb',
                        Roles: ['Storage'],
                        Location: {
                            Rack: 'Rack-1',
                            DataCenter: 'DC1',
                        },
                    },
                ],
            }),
        });
    });
}

/**
 * Setup mocks for State mode testing
 */
export async function setupStateModeMocks(page: Page) {
    await setupMonitoringUserMock(page);
    await setupCapabilitiesMock(page);
    await setupNodeInfoMock(page);

    await page.route('**/storage/groups?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createStorageGroupsWithStates()),
        });
    });
}

/**
 * Setup mocks for Space mode testing
 */
export async function setupSpaceModeMocks(page: Page) {
    await setupMonitoringUserMock(page);
    await setupCapabilitiesMock(page);
    await setupNodeInfoMock(page);

    await page.route('**/storage/groups?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createStorageGroupsWithSpaceStates()),
        });
    });
}

/**
 * Setup mocks for Space mode with replication variants
 */
export async function setupSpaceWithReplicationMocks(page: Page) {
    await setupMonitoringUserMock(page);
    await setupCapabilitiesMock(page);
    await setupNodeInfoMock(page);

    await page.route('**/storage/groups?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(createStorageGroupsWithSpaceAndReplication()),
        });
    });
}
