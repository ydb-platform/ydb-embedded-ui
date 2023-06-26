// Space - out of space nodes or groups
// Missing - nodes or groups with missing disks
export type StorageProblemType = 'all' | 'missing' | 'space';

export interface StorageApiRequestParams {
    tenant?: string;
    nodeId?: string;
    problemFilter?: StorageProblemType;
}
