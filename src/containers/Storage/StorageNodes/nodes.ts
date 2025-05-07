import {EFlag} from '../../../types/api/enums';
import type {
    TEndpoint,
    TNodeInfo,
    TNodesInfo,
    TPoolStats,
    TSystemStateInfo,
} from '../../../types/api/nodes';
import {TPDiskState} from '../../../types/api/pdisk';
import {EVDiskState} from '../../../types/api/vdisk';

// Different disk sizes to simulate variety (in bytes)
const DISK_SIZES = [
    '68719476736', // 64 GB
    '137438953472', // 128 GB
    '274877906944', // 256 GB
    '549755813888', // 512 GB
    '1099511627776', // 1 TB
];

const getRandomDiskSize = () => DISK_SIZES[Math.floor(Math.random() * DISK_SIZES.length)];

const generatePoolStats = (count = 5): TPoolStats[] => {
    const poolNames = ['System', 'User', 'Batch', 'IO', 'IC'] as const;
    return poolNames.slice(0, count).map((Name) => ({
        Name,
        Usage: Math.random() * 0.02,
        Threads: Math.floor(Math.random() * 3) + 1,
    }));
};

const generateEndpoints = (): TEndpoint[] => [
    {Name: 'ic', Address: ':19001'},
    {Name: 'http-mon', Address: ':8765'},
    {Name: 'grpcs', Address: ':2135'},
    {Name: 'grpc', Address: ':2136'},
];

const generateSystemState = (nodeId: number): TSystemStateInfo => ({
    StartTime: '1734358137851',
    ChangeTime: '1734358421375',
    LoadAverage: [3.381347656, 2.489257813, 1.279296875],
    NumberOfCpus: 8,
    SystemState: EFlag.Green,
    NodeId: nodeId,
    Host: `localhost-${nodeId}`,
    Version: 'main.95ce0df',
    PoolStats: generatePoolStats(),
    Endpoints: generateEndpoints(),
    Roles: ['Bootstrapper', 'StateStorage', 'StateStorageBoard', 'SchemeBoard', 'Storage'],
    MemoryLimit: '2147483648',
    MaxDiskUsage: 0.002349853516,
    Location: {
        DataCenter: '1',
        Rack: '1',
        Unit: '1',
    },
    TotalSessions: 0,
    CoresUsed: 0.07583969556,
    CoresTotal: 8,
});

const generatePDisk = (nodeId: number, pdiskId: number, totalSize = '68719476736') => ({
    PDiskId: pdiskId,
    ChangeTime: '1734358142074',
    Path: `/ydb_data/pdisk${pdiskId}l3ki78no.data`,
    Guid: pdiskId.toString(),
    Category: '0',
    TotalSize: totalSize,
    AvailableSize: (Number(totalSize) * 0.9).toString(), // 90% available by default
    State: TPDiskState.Normal,
    NodeId: nodeId,
    Device: EFlag.Green,
    Realtime: EFlag.Green,
    SerialNumber: '',
    SystemSize: '213909504',
    LogUsedSize: '35651584',
    LogTotalSize: '68486692864',
    EnforcedDynamicSlotSize: '22817013760',
});

const generateVDisk = (nodeId: number, vdiskId: number, pdiskId: number) => ({
    VDiskId: {
        GroupID: vdiskId,
        GroupGeneration: 1,
        Ring: 0,
        Domain: 0,
        VDisk: 0,
    },
    ChangeTime: '1734358420919',
    PDiskId: pdiskId,
    VDiskSlotId: vdiskId,
    Guid: '1',
    Kind: '0',
    NodeId: nodeId,
    VDiskState: EVDiskState.OK,
    DiskSpace: EFlag.Green,
    SatisfactionRank: {
        FreshRank: {
            Flag: EFlag.Green,
        },
        LevelRank: {
            Flag: EFlag.Green,
        },
    },
    Replicated: true,
    ReplicationProgress: 1,
    ReplicationSecondsRemaining: 0,
    AllocatedSize: '0',
    AvailableSize: '22817013760',
    HasUnreadableBlobs: false,
    IncarnationGuid: '11528832187803248876',
    InstanceGuid: '14836434871903384493',
    FrontQueues: EFlag.Green,
    StoragePoolName: 'static',
    ReadThroughput: '0',
    WriteThroughput: '420',
});

interface NodeGeneratorOptions {
    maxVdisksPerPDisk?: number;
    maxPdisks?: number;
}

const DEFAULT_OPTIONS: NodeGeneratorOptions = {
    maxVdisksPerPDisk: 3,
    maxPdisks: 4,
};

const generateNode = (nodeId: number, options: NodeGeneratorOptions = {}): TNodeInfo => {
    const maxPdisks = options.maxPdisks ?? DEFAULT_OPTIONS.maxPdisks!;
    const maxVdisksPerPDisk = options.maxVdisksPerPDisk ?? DEFAULT_OPTIONS.maxVdisksPerPDisk!;

    // Generate a random number of pdisks up to maxPdisks
    const pdisksCount = Math.floor(Math.random() * maxPdisks) + 1;

    // For each pdisk, generate a random number of vdisks up to maxVdisksPerPDisk
    const pdiskVdisksCounts = Array.from({length: pdisksCount}, () =>
        Math.floor(Math.random() * maxVdisksPerPDisk),
    );
    const totalVdisks = pdiskVdisksCounts.reduce((sum: number, count: number) => sum + count, 0);

    return {
        NodeId: nodeId,
        UptimeSeconds: 284,
        CpuUsage: 0.00947996,
        DiskSpaceUsage: 0.234985,
        SystemState: generateSystemState(nodeId),
        PDisks: Array.from({length: pdisksCount}, (_, i) =>
            generatePDisk(nodeId, i + 1, getRandomDiskSize()),
        ),
        VDisks: Array.from({length: totalVdisks}, (_, i) => {
            // Find which pdisk this vdisk belongs to based on the distribution
            let pdiskIndex = 0;
            let vdiskCount = pdiskVdisksCounts[0];
            while (i >= vdiskCount && pdiskIndex < pdisksCount - 1) {
                pdiskIndex++;
                vdiskCount += pdiskVdisksCounts[pdiskIndex];
            }
            return generateVDisk(nodeId, i, pdiskIndex + 1);
        }),
    };
};

interface GenerateNodesOptions extends NodeGeneratorOptions {
    offset?: number;
    limit?: number;
}

// Keep a cache of generated nodes to maintain consistency between paginated requests
let cachedNodes: TNodeInfo[] | null = null;
let currentTotalNodes = 50; // Default number of nodes

export const generateNodes = (count?: number, options: GenerateNodesOptions = {}): TNodesInfo => {
    const totalNodes = count ?? currentTotalNodes;
    const {offset = 0, limit = totalNodes, maxVdisksPerPDisk, maxPdisks} = options;

    // Reset cache if total nodes count changes
    if (totalNodes !== currentTotalNodes) {
        cachedNodes = null;
        currentTotalNodes = totalNodes;
    }

    // Generate or use cached nodes
    if (!cachedNodes) {
        cachedNodes = Array.from({length: totalNodes}, (_, i) =>
            generateNode(i + 1, {maxVdisksPerPDisk, maxPdisks}),
        );
    }

    // Calculate MaximumSlotsPerDisk and MaximumDisksPerNode across all nodes
    let maxSlotsPerDisk = 0;
    let maxDisksPerNode = 0;

    cachedNodes.forEach((node) => {
        // Count pdisks per node
        if (node.PDisks) {
            maxDisksPerNode = Math.max(maxDisksPerNode, node.PDisks.length);
        }

        // Count vdisks per pdisk
        if (node.VDisks) {
            const pdiskVdiskCounts = new Map<number, number>();
            node.VDisks.forEach((vdisk) => {
                if (typeof vdisk.PDiskId === 'number') {
                    const count = (pdiskVdiskCounts.get(vdisk.PDiskId) || 0) + 1;
                    pdiskVdiskCounts.set(vdisk.PDiskId, count);
                    maxSlotsPerDisk = Math.max(maxSlotsPerDisk, count);
                }
            });
        }
    });

    // Get the requested slice of nodes
    const paginatedNodes = cachedNodes.slice(offset, offset + limit);

    return {
        TotalNodes: totalNodes.toString(),
        FoundNodes: totalNodes.toString(),
        Nodes: paginatedNodes,
        MaximumSlotsPerDisk: maxSlotsPerDisk.toString(),
        MaximumDisksPerNode: maxDisksPerNode.toString(),
    };
};
